import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AddRounded from '@mui/icons-material/AddRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import { api } from '../../api/http'
import './PlanosPage.css'

type StatusPlano = 'VENCIDA' | 'PROXIMA' | 'EM_DIA'
interface Plano {
  id: number; equipamentoId: number; codigoEquipamento: string; nomeEquipamento: string
  nome: string; intervaloHoras: number; antecedenciaAlertaHoras: number
  horimetroUltimaExecucao: number; proximoVencimento: number; horimetroAtual: number
  horasRestantes: number; status: StatusPlano; ativo: boolean
}
interface Equipamento { id: number; codigo: string; nome: string; status: string; horimetroAtual: number }
interface Pagina<T> { content: T[]; totalElements: number; totalPages: number }
interface Formulario { equipamentoId: string; nome: string; intervaloHoras: string; antecedenciaAlertaHoras: string; horimetroUltimaExecucao: string; ativo: boolean }
const vazio: Formulario = { equipamentoId: '', nome: '', intervaloHoras: '', antecedenciaAlertaHoras: '', horimetroUltimaExecucao: '0', ativo: true }

export default function PlanosPage() {
  const client = useQueryClient()
  const [equipamentoFiltro, setEquipamentoFiltro] = useState('')
  const [ativoFiltro, setAtivoFiltro] = useState('true')
  const [pagina, setPagina] = useState(0)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Plano | null>(null)
  const [form, setForm] = useState(vazio)
  const equipamentosQuery = useQuery({ queryKey: ['equipamentos-opcoes'], queryFn: () => api.get<Pagina<Equipamento>>('/api/v1/equipamentos?size=100&sort=nome,asc') })
  const planosQuery = useQuery({
    queryKey: ['planos', equipamentoFiltro, ativoFiltro, pagina],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(pagina), size: '10', sort: 'nome,asc' })
      if (equipamentoFiltro) params.set('equipamentoId', equipamentoFiltro)
      if (ativoFiltro) params.set('ativo', ativoFiltro)
      return api.get<Pagina<Plano>>(`/api/v1/planos?${params}`)
    },
  })
  const salvar = useMutation({
    mutationFn: () => {
      const dados = { nome: form.nome, intervaloHoras: Number(form.intervaloHoras), antecedenciaAlertaHoras: Number(form.antecedenciaAlertaHoras), horimetroUltimaExecucao: Number(form.horimetroUltimaExecucao), ativo: form.ativo }
      return editando
        ? api.put<Plano>(`/api/v1/planos/${editando.id}`, dados)
        : api.post<Plano>('/api/v1/planos', { ...dados, equipamentoId: Number(form.equipamentoId) })
    },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['planos'] }); await client.invalidateQueries({ queryKey: ['dashboard-resumo'] }); fechar() },
  })
  const alternar = useMutation({
    mutationFn: ({ plano, ativo }: { plano: Plano; ativo: boolean }) => api.patch<Plano>(`/api/v1/planos/${plano.id}/status?ativo=${ativo}`),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['planos'] }); await client.invalidateQueries({ queryKey: ['dashboard-resumo'] }) },
  })

  function abrirNovo() { setEditando(null); setForm({ ...vazio, equipamentoId: equipamentoFiltro || '' }); salvar.reset(); setModal(true) }
  function abrirEdicao(plano: Plano) {
    setEditando(plano); setForm({ equipamentoId: String(plano.equipamentoId), nome: plano.nome, intervaloHoras: String(plano.intervaloHoras), antecedenciaAlertaHoras: String(plano.antecedenciaAlertaHoras), horimetroUltimaExecucao: String(plano.horimetroUltimaExecucao), ativo: plano.ativo }); salvar.reset(); setModal(true)
  }
  function fechar() { setModal(false); setEditando(null); setForm(vazio); salvar.reset() }
  function enviar(event: FormEvent) { event.preventDefault(); salvar.mutate() }
  const planos = planosQuery.data?.content ?? []
  const equipamentos = equipamentosQuery.data?.content ?? []

  return <section className="plans-page">
    <header className="plans-heading"><div><p className="plans-eyebrow">REGRAS DE MANUTENÇÃO</p><h2>Planos de manutenção</h2><p>Defina intervalos preventivos e acompanhe os próximos vencimentos.</p></div><button className="plans-primary" onClick={abrirNovo}><AddRounded /> Novo plano</button></header>
    <section className="plans-panel">
      <div className="plans-filters">
        <label>Equipamento<select value={equipamentoFiltro} onChange={e => { setEquipamentoFiltro(e.target.value); setPagina(0) }}><option value="">Todos</option>{equipamentos.map(e => <option key={e.id} value={e.id}>{e.codigo} · {e.nome}</option>)}</select></label>
        <label>Situação<select value={ativoFiltro} onChange={e => { setAtivoFiltro(e.target.value); setPagina(0) }}><option value="true">Ativos</option><option value="false">Inativos</option><option value="">Todos</option></select></label>
        <span className="plans-total">{planosQuery.data?.totalElements ?? 0} planos</span>
      </div>
      {equipamentosQuery.isError || planosQuery.isError ? <div className="plans-state plans-error" role="alert"><strong>Não foi possível carregar os planos.</strong><button onClick={() => { void equipamentosQuery.refetch(); void planosQuery.refetch() }}>Tentar novamente</button></div>
        : planosQuery.isPending || equipamentosQuery.isPending ? <div className="plans-state">Carregando planos…</div>
          : planos.length === 0 ? <div className="plans-state"><strong>Nenhum plano encontrado</strong><span>Crie um plano para começar a acompanhar a manutenção preventiva.</span><button onClick={abrirNovo}>Criar plano</button></div>
            : <><div className="plans-table-wrap"><table className="plans-table"><thead><tr><th>Plano</th><th>Equipamento</th><th>Intervalo</th><th>Próximo vencimento</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{planos.map(plano => <tr key={plano.id}>
              <td><strong>{plano.nome}</strong><small>A cada {horas(plano.intervaloHoras)} · alertar com {horas(plano.antecedenciaAlertaHoras)} de antecedência</small></td>
              <td><strong>{plano.codigoEquipamento}</strong><small>{plano.nomeEquipamento}</small></td>
              <td>{horas(plano.intervaloHoras)}</td><td><strong>{horas(plano.proximoVencimento)}</strong><small>{plano.horasRestantes <= 0 ? `${horas(Math.abs(plano.horasRestantes))} em atraso` : `Faltam ${horas(plano.horasRestantes)}`}</small></td>
              <td><span className={`plans-badge plans-badge--${plano.ativo ? plano.status.toLowerCase() : 'inativo'}`}>{plano.ativo ? rotuloStatus(plano.status) : 'Inativo'}</span></td>
              <td className="plans-actions"><button aria-label={`Editar ${plano.nome}`} title="Editar plano" onClick={() => abrirEdicao(plano)}><EditOutlined /></button><button disabled={alternar.isPending} onClick={() => alternar.mutate({ plano, ativo: !plano.ativo })}>{plano.ativo ? 'Desativar' : 'Ativar'}</button></td>
            </tr>)}</tbody></table></div><footer className="plans-pagination"><span>Página {pagina + 1} de {Math.max(planosQuery.data?.totalPages ?? 1, 1)}</span><div><button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>Anterior</button><button disabled={pagina + 1 >= (planosQuery.data?.totalPages ?? 0)} onClick={() => setPagina(p => p + 1)}>Próxima</button></div></footer></>}
    </section>
    {modal && <div className="plans-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}><section className="plans-modal" role="dialog" aria-modal="true" aria-labelledby="plans-modal-title"><header><h2 id="plans-modal-title">{editando ? 'Editar plano' : 'Novo plano'}</h2><button aria-label="Fechar" onClick={fechar}>×</button></header><form onSubmit={enviar}>
      <p>O status de vencimento é calculado com base no horímetro atual do equipamento.</p>
      <label>Equipamento<select required disabled={Boolean(editando)} value={form.equipamentoId} onChange={e => { const id = e.target.value; const equipamento = equipamentos.find(item => item.id === Number(id)); setForm({ ...form, equipamentoId: id, horimetroUltimaExecucao: equipamento ? String(equipamento.horimetroAtual) : '' }) }}><option value="">Selecione um equipamento</option>{equipamentos.filter(e => e.status !== 'INATIVO').map(e => <option key={e.id} value={e.id}>{e.codigo} · {e.nome} ({horas(e.horimetroAtual)})</option>)}</select></label>
      <label>Nome do plano<input required maxLength={120} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Troca de óleo do motor" /></label>
      <div className="plans-form-grid"><label>Intervalo (horas)<input required type="number" min="0.1" step="0.1" value={form.intervaloHoras} onChange={e => setForm({ ...form, intervaloHoras: e.target.value })} /></label><label>Antecedência do alerta (h)<input required type="number" min="0" step="0.1" value={form.antecedenciaAlertaHoras} onChange={e => setForm({ ...form, antecedenciaAlertaHoras: e.target.value })} /></label><label>Horímetro da última execução<input required type="number" min="0" step="0.1" value={form.horimetroUltimaExecucao} onChange={e => setForm({ ...form, horimetroUltimaExecucao: e.target.value })} /></label></div>
      <label className="plans-checkbox"><input type="checkbox" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} /> Plano ativo</label>
      {salvar.isError && <p className="plans-form-error" role="alert">{salvar.error.message}</p>}<footer><button type="button" onClick={fechar}>Cancelar</button><button className="plans-primary" disabled={salvar.isPending} type="submit">{salvar.isPending ? 'Salvando…' : 'Salvar plano'}</button></footer>
    </form></section></div>}
  </section>
}

function horas(valor: number) { return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor)} h` }
function rotuloStatus(status: StatusPlano) { return ({ VENCIDA: 'Vencida', PROXIMA: 'Próxima', EM_DIA: 'Em dia' })[status] }
