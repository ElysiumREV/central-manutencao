import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import './LeiturasPage.css'

type StatusPlano = 'VENCIDA' | 'PROXIMA' | 'EM_DIA'
interface Equipamento { id: number; codigo: string; nome: string; status: string; horimetroAtual: number; dataUltimaLeitura: string | null }
interface Plano { id: number; nome: string; status: StatusPlano; horasRestantes: number }
interface Pagina<T> { content: T[] }
interface Formulario { equipamentoId: string; valor: string; dataHora: string; responsavel: string; observacao: string }
interface Mudanca { plano: string; de: StatusPlano; para: StatusPlano; horasRestantes: number }
interface Resultado { equipamento: string; valor: number; mudancas: Mudanca[] }

interface Props {
  /** Equipamento já escolhido (ex.: ao abrir a partir de um alerta do painel). */
  equipamentoId?: number
  /** Horímetro atual do equipamento escolhido, usado como valor inicial da leitura. */
  horimetroAtual?: number
  aoFechar: () => void
}

/**
 * Diálogo de registro de leitura, usado na tela de leituras, no painel e no atalho da topbar.
 *
 * Depois de salvar, mostra o impacto da leitura nos planos do equipamento (ex.: "Próxima → Vencida").
 * O status continua sendo calculado só pelo backend: o diálogo compara a lista de planos antes e depois.
 */
export default function RegistrarLeituraDialog({ equipamentoId, horimetroAtual, aoFechar }: Props) {
  const client = useQueryClient()
  const [form, setForm] = useState<Formulario>({
    equipamentoId: equipamentoId ? String(equipamentoId) : '',
    valor: horimetroAtual !== undefined ? String(horimetroAtual) : '',
    dataHora: agoraLocal(), responsavel: '', observacao: '',
  })
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const equipamentosQuery = useQuery({ queryKey: ['equipamentos-opcoes'], queryFn: () => api.get<Pagina<Equipamento>>('/api/v1/equipamentos?size=100&sort=nome,asc') })
  const equipamento = equipamentosQuery.data?.content.find(item => item.id === Number(form.equipamentoId))
  // Situação dos planos antes da leitura: base para mostrar o que mudou depois de salvar.
  const planosAntesQuery = useQuery({
    queryKey: ['planos-impacto', form.equipamentoId],
    queryFn: () => buscarPlanos(form.equipamentoId),
    enabled: Boolean(form.equipamentoId) && !resultado,
  })

  const registrar = useMutation({
    mutationFn: async () => {
      const antes = planosAntesQuery.data ?? []
      await api.post(`/api/v1/equipamentos/${form.equipamentoId}/leituras`, {
        valor: Number(form.valor), dataHora: new Date(form.dataHora).toISOString(),
        responsavel: form.responsavel, observacao: form.observacao || null,
      })
      const depois = await buscarPlanos(form.equipamentoId)
      const mudancas = depois.flatMap(plano => {
        const anterior = antes.find(item => item.id === plano.id)
        return anterior && anterior.status !== plano.status
          ? [{ plano: plano.nome, de: anterior.status, para: plano.status, horasRestantes: plano.horasRestantes }]
          : []
      })
      return { equipamento: equipamento ? `${equipamento.codigo} · ${equipamento.nome}` : '', valor: Number(form.valor), mudancas }
    },
    onSuccess: async (dados) => {
      setResultado(dados)
      await Promise.all(['leituras', 'equipamentos', 'equipamentos-opcoes', 'planos', 'alertas', 'dashboard-resumo']
        .map(chave => client.invalidateQueries({ queryKey: [chave] })))
    },
  })

  function enviar(event: FormEvent) { event.preventDefault(); registrar.mutate() }
  function escolherEquipamento(id: string) {
    const escolhido = equipamentosQuery.data?.content.find(item => item.id === Number(id))
    setForm({ ...form, equipamentoId: id, valor: escolhido ? String(escolhido.horimetroAtual) : '' })
  }

  return <div className="readings-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) aoFechar() }}>
    <section className="readings-modal" role="dialog" aria-modal="true" aria-labelledby="readings-modal-title">
      <header><h2 id="readings-modal-title">{resultado ? 'Leitura registrada' : 'Registrar leitura'}</h2><button aria-label="Fechar" onClick={aoFechar}>×</button></header>
      {resultado ? <div className="readings-result" role="status">
        <p><strong>{horas(resultado.valor)}</strong> registradas para <strong>{resultado.equipamento}</strong>.</p>
        {resultado.mudancas.length === 0
          ? <p className="readings-result-neutral">Nenhum plano mudou de situação com esta leitura.</p>
          : <ul className="readings-impact">{resultado.mudancas.map(mudanca => <li key={mudanca.plano}>
            <strong>{mudanca.plano}</strong>
            <span><span className={`readings-status readings-status--${mudanca.de.toLowerCase()}`}>{rotulo(mudanca.de)}</span> → <span className={`readings-status readings-status--${mudanca.para.toLowerCase()}`}>{rotulo(mudanca.para)}</span></span>
            <small>{mudanca.horasRestantes <= 0 ? `${horas(Math.abs(mudanca.horasRestantes))} de atraso` : `faltam ${horas(mudanca.horasRestantes)}`}</small>
          </li>)}</ul>}
        <footer><button className="readings-primary" onClick={aoFechar} autoFocus>Fechar</button></footer>
      </div> : <form onSubmit={enviar}>
        <p>O valor deve ser igual ou maior que o horímetro atual. Ao salvar, os alertas preventivos serão recalculados.</p>
        <label>Equipamento<select required value={form.equipamentoId} onChange={e => escolherEquipamento(e.target.value)}><option value="">Selecione um equipamento</option>{(equipamentosQuery.data?.content ?? []).filter(item => item.status !== 'INATIVO').map(item => <option key={item.id} value={item.id}>{item.codigo} · {item.nome}</option>)}</select></label>
        {equipamento && <div className="readings-current"><span>Horímetro atual{equipamento.dataUltimaLeitura ? ` · última leitura em ${formatarData(equipamento.dataUltimaLeitura)}` : ''}</span><strong>{horas(equipamento.horimetroAtual)}</strong></div>}
        <div className="readings-form-grid">
          <label>Novo horímetro (h)<input required type="number" min={equipamento?.horimetroAtual ?? 0} step="0.1" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></label>
          <label>Data e hora<input required type="datetime-local" min={equipamento?.dataUltimaLeitura ? paraLocal(equipamento.dataUltimaLeitura) : undefined} max={agoraLocal()} value={form.dataHora} onChange={e => setForm({ ...form, dataHora: e.target.value })} /></label>
        </div>
        <label>Responsável<input required maxLength={120} value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} autoFocus={Boolean(equipamentoId)} /></label>
        <label>Observação (opcional)<textarea maxLength={500} rows={3} value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} /></label>
        {registrar.isError && <p className="readings-form-error" role="alert">{registrar.error.message}</p>}
        <footer><button type="button" onClick={aoFechar}>Cancelar</button><button className="readings-primary" type="submit" disabled={registrar.isPending || !form.equipamentoId || planosAntesQuery.isPending}>{registrar.isPending ? 'Registrando…' : 'Salvar leitura'}</button></footer>
      </form>}
    </section>
  </div>
}

async function buscarPlanos(equipamentoId: string) {
  const pagina = await api.get<Pagina<Plano>>(`/api/v1/planos?equipamentoId=${equipamentoId}&ativo=true&size=100`)
  return pagina.content
}
function rotulo(status: StatusPlano) { return ({ VENCIDA: 'Vencida', PROXIMA: 'Próxima', EM_DIA: 'Em dia' })[status] }
function horas(valor: number) { return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor)} h` }
function formatarData(valor: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) }
function paraLocal(data: string | Date) { const local = new Date(data); local.setMinutes(local.getMinutes() - local.getTimezoneOffset()); return local.toISOString().slice(0, 16) }
function agoraLocal() { return paraLocal(new Date()) }
