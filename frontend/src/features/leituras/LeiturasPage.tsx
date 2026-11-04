import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AddRounded from '@mui/icons-material/AddRounded'
import { api } from '../../api/http'
import './LeiturasPage.css'

interface Leitura { id: number; equipamentoId: number; codigoEquipamento: string; nomeEquipamento: string; valor: number; dataHora: string; responsavel: string; observacao: string | null }
interface Equipamento { id: number; codigo: string; nome: string; status: string; horimetroAtual: number; dataUltimaLeitura: string | null }
interface Pagina<T> { content: T[]; totalElements: number; totalPages: number }
interface Formulario { equipamentoId: string; valor: string; dataHora: string; responsavel: string; observacao: string }
const agoraLocal = () => { const agora = new Date(); agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset()); return agora.toISOString().slice(0, 16) }

export default function LeiturasPage() {
  const client = useQueryClient()
  const [pagina, setPagina] = useState(0)
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Formulario>({ equipamentoId: '', valor: '', dataHora: agoraLocal(), responsavel: '', observacao: '' })
  const params = new URLSearchParams({ page: String(pagina), size: '15', sort: 'dataHora,desc' })
  if (de) params.set('de', new Date(`${de}T00:00:00`).toISOString())
  if (ate) params.set('ate', new Date(`${ate}T23:59:59.999`).toISOString())
  const leiturasQuery = useQuery({ queryKey: ['leituras', de, ate, pagina], queryFn: () => api.get<Pagina<Leitura>>(`/api/v1/leituras?${params}`) })
  const equipamentosQuery = useQuery({ queryKey: ['equipamentos-opcoes'], queryFn: () => api.get<Pagina<Equipamento>>('/api/v1/equipamentos?size=100&sort=nome,asc') })
  const equipamentoSelecionado = equipamentosQuery.data?.content.find(item => item.id === Number(form.equipamentoId))
  const registrar = useMutation({
    mutationFn: () => api.post<Leitura>(`/api/v1/equipamentos/${form.equipamentoId}/leituras`, { valor: Number(form.valor), dataHora: new Date(form.dataHora).toISOString(), responsavel: form.responsavel, observacao: form.observacao || null }),
    onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['leituras'] }), client.invalidateQueries({ queryKey: ['equipamentos'] }), client.invalidateQueries({ queryKey: ['equipamentos-opcoes'] }), client.invalidateQueries({ queryKey: ['planos'] }), client.invalidateQueries({ queryKey: ['dashboard-resumo'] })]); setModal(false); registrar.reset(); setForm({ equipamentoId: '', valor: '', dataHora: agoraLocal(), responsavel: '', observacao: '' }) },
  })
  function abrir() { registrar.reset(); setForm({ equipamentoId: '', valor: '', dataHora: agoraLocal(), responsavel: '', observacao: '' }); setModal(true) }
  function enviar(event: FormEvent) { event.preventDefault(); registrar.mutate() }
  const leituras = leiturasQuery.data?.content ?? []
  const erro = leiturasQuery.isError || equipamentosQuery.isError

  return <section className="readings-page">
    <header className="readings-heading"><div><p className="readings-eyebrow">HISTÓRICO OPERACIONAL</p><h2>Leituras de horímetro</h2><p>Registre novas medições e acompanhe a evolução dos equipamentos.</p></div><button className="readings-primary" onClick={abrir}><AddRounded /> Registrar leitura</button></header>
    <section className="readings-panel">
      <form className="readings-filters" onSubmit={event => { event.preventDefault(); setPagina(0); void leiturasQuery.refetch() }}><label>De<input type="date" value={de} onChange={e => setDe(e.target.value)} /></label><label>Até<input type="date" value={ate} onChange={e => setAte(e.target.value)} /></label><button type="submit">Filtrar período</button><span>{leiturasQuery.data?.totalElements ?? 0} leituras</span></form>
      {erro ? <div className="readings-state readings-error" role="alert"><strong>Não foi possível carregar as leituras.</strong><button onClick={() => { void leiturasQuery.refetch(); void equipamentosQuery.refetch() }}>Tentar novamente</button></div>
        : leiturasQuery.isPending ? <div className="readings-state">Carregando histórico…</div>
          : leituras.length === 0 ? <div className="readings-state"><strong>Nenhuma leitura encontrada</strong><span>Registre uma leitura ou altere o período selecionado.</span><button onClick={abrir}>Registrar leitura</button></div>
            : <><div className="readings-table-wrap"><table className="readings-table"><thead><tr><th>Data e hora</th><th>Equipamento</th><th>Horímetro registrado</th><th>Responsável</th><th>Observação</th></tr></thead><tbody>{leituras.map(leitura => <tr key={leitura.id}><td>{formatarData(leitura.dataHora)}</td><td><strong>{leitura.codigoEquipamento}</strong><small>{leitura.nomeEquipamento}</small></td><td className="reading-hours">{horas(leitura.valor)}</td><td>{leitura.responsavel}</td><td className="reading-observation">{leitura.observacao || '—'}</td></tr>)}</tbody></table></div><footer className="readings-pagination"><span>Página {pagina + 1} de {Math.max(leiturasQuery.data?.totalPages ?? 1, 1)}</span><div><button disabled={!pagina} onClick={() => setPagina(p => p - 1)}>Anterior</button><button disabled={pagina + 1 >= (leiturasQuery.data?.totalPages ?? 0)} onClick={() => setPagina(p => p + 1)}>Próxima</button></div></footer></>}
    </section>
    {modal && <div className="readings-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}><section className="readings-modal" role="dialog" aria-modal="true" aria-labelledby="readings-modal-title"><header><h2 id="readings-modal-title">Registrar leitura</h2><button aria-label="Fechar" onClick={() => setModal(false)}>×</button></header><form onSubmit={enviar}>
      <p>O valor deve ser igual ou maior que o horímetro atual. Ao salvar, os alertas preventivos serão recalculados.</p>
      <label>Equipamento<select required value={form.equipamentoId} onChange={e => { const equipamentoId = e.target.value; setForm({ ...form, equipamentoId, valor: equipamentosQuery.data?.content.find(item => item.id === Number(equipamentoId))?.horimetroAtual.toString() ?? '' }) }}><option value="">Selecione um equipamento</option>{(equipamentosQuery.data?.content ?? []).filter(item => item.status !== 'INATIVO').map(item => <option key={item.id} value={item.id}>{item.codigo} · {item.nome}</option>)}</select></label>
      {equipamentoSelecionado && <div className="readings-current"><span>Horímetro atual</span><strong>{horas(equipamentoSelecionado.horimetroAtual)}</strong></div>}
      <div className="readings-form-grid"><label>Novo horímetro (h)<input required type="number" min={equipamentoSelecionado?.horimetroAtual ?? 0} step="0.1" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></label><label>Data e hora<input required type="datetime-local" max={agoraLocal()} value={form.dataHora} onChange={e => setForm({ ...form, dataHora: e.target.value })} /></label></div>
      <label>Responsável<input required maxLength={120} value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></label><label>Observação (opcional)<textarea maxLength={500} rows={3} value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} /></label>
      {registrar.isError && <p className="readings-form-error" role="alert">{registrar.error.message}</p>}<footer><button type="button" onClick={() => setModal(false)}>Cancelar</button><button className="readings-primary" type="submit" disabled={registrar.isPending || !form.equipamentoId}>{registrar.isPending ? 'Registrando…' : 'Salvar leitura'}</button></footer>
    </form></section></div>}
  </section>
}

function horas(valor: number) { return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor)} h` }
function formatarData(valor: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) }
