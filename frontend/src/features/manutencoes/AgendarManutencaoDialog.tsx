import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { Equipamento, Manutencao, Pagina, Plano, TipoManutencao as Tipo } from '../../api/tipos'
import './ManutencoesPage.css'

interface Props {
  /** Equipamento e plano já escolhidos (ex.: ao abrir a partir de um alerta do painel). */
  equipamentoId?: number
  planoId?: number
  aoFechar: () => void
}

/**
 * Diálogo de agendamento, usado na tela de manutenções e no painel.
 *
 * Avisa antes de enviar quando o plano já tem um agendamento aberto. O backend continua barrando o
 * caso (409 no service e índice único parcial no banco); o aviso só evita que o usuário descubra no erro.
 */
export default function AgendarManutencaoDialog({ equipamentoId, planoId, aoFechar }: Props) {
  const client = useQueryClient()
  const [form, setForm] = useState({
    equipamentoId: equipamentoId ? String(equipamentoId) : '',
    planoId: planoId ? String(planoId) : '',
    tipo: 'PREVENTIVA' as Tipo,
    dataAgendada: hojeLocal(),
    responsavel: '',
    observacoes: '',
  })

  const equipamentosQuery = useQuery({
    queryKey: ['equipamentos-opcoes'],
    queryFn: () => api.get<Pagina<Equipamento>>('/api/v1/equipamentos?size=100&sort=nome,asc'),
  })
  const planosQuery = useQuery({
    queryKey: ['planos-opcoes', form.equipamentoId],
    queryFn: () =>
      api.get<Pagina<Plano>>(`/api/v1/planos?equipamentoId=${form.equipamentoId}&ativo=true&size=100&sort=nome,asc`),
    enabled: Boolean(form.equipamentoId),
  })
  const agendadasQuery = useQuery({
    queryKey: ['manutencoes', 'agendadas-do-equipamento', form.equipamentoId],
    queryFn: () =>
      api.get<Pagina<Manutencao>>(`/api/v1/manutencoes?status=AGENDADA&equipamentoId=${form.equipamentoId}&size=100`),
    enabled: Boolean(form.equipamentoId),
  })
  const agendamentoExistente =
    form.tipo === 'PREVENTIVA' && form.planoId
      ? agendadasQuery.data?.content.find(item => item.planoId === Number(form.planoId))
      : undefined

  const salvar = useMutation({
    mutationFn: () =>
      api.post('/api/v1/manutencoes', {
        equipamentoId: Number(form.equipamentoId),
        planoId: form.tipo === 'PREVENTIVA' ? Number(form.planoId) : null,
        tipo: form.tipo,
        dataAgendada: form.dataAgendada,
        responsavel: form.responsavel,
        observacoes: form.observacoes || null,
      }),
    onSuccess: async () => {
      await Promise.all(
        ['manutencoes', 'planos', 'alertas', 'dashboard-resumo', 'equipamentos-opcoes'].map(chave =>
          client.invalidateQueries({ queryKey: [chave] }),
        ),
      )
      aoFechar()
    },
  })

  function enviar(event: FormEvent) {
    event.preventDefault()
    salvar.mutate()
  }

  return (
    <div
      className="maintenance-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) aoFechar()
      }}
    >
      <section className="maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title">
        <header>
          <h2 id="schedule-dialog-title">Agendar manutenção</h2>
          <button aria-label="Fechar" onClick={aoFechar}>
            ×
          </button>
        </header>
        <form onSubmit={enviar}>
          <p>Manutenções preventivas precisam estar vinculadas a um plano ativo.</p>
          <label>
            Equipamento
            <select
              required
              value={form.equipamentoId}
              onChange={e => setForm({ ...form, equipamentoId: e.target.value, planoId: '' })}
            >
              <option value="">Selecione</option>
              {(equipamentosQuery.data?.content ?? [])
                .filter(item => item.status !== 'INATIVO')
                .map(item => (
                  <option key={item.id} value={item.id}>
                    {item.codigo} · {item.nome}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Tipo
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as Tipo, planoId: '' })}>
              <option value="PREVENTIVA">Preventiva</option>
              <option value="CORRETIVA">Corretiva</option>
            </select>
          </label>
          {form.tipo === 'PREVENTIVA' && (
            <label>
              Plano
              <select required value={form.planoId} onChange={e => setForm({ ...form, planoId: e.target.value })}>
                <option value="">Selecione um plano ativo</option>
                {(planosQuery.data?.content ?? []).map(plano => (
                  <option key={plano.id} value={plano.id}>
                    {plano.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          {agendamentoExistente && (
            <p className="maintenance-form-warning" role="status">
              Este plano já tem manutenção agendada
              {agendamentoExistente.dataAgendada ? ` para ${formatarDia(agendamentoExistente.dataAgendada)}` : ''}.
              Conclua ou cancele esse agendamento na tela de Manutenções antes de criar outro.
            </p>
          )}
          <div className="maintenance-form-grid">
            <label>
              Data agendada
              <input
                type="date"
                required
                min={hojeLocal()}
                value={form.dataAgendada}
                onChange={e => setForm({ ...form, dataAgendada: e.target.value })}
              />
            </label>
            <label>
              Responsável
              <input
                required
                maxLength={120}
                value={form.responsavel}
                onChange={e => setForm({ ...form, responsavel: e.target.value })}
                autoFocus={Boolean(planoId)}
              />
            </label>
          </div>
          <label>
            Observações (opcional)
            <textarea
              rows={3}
              maxLength={2000}
              value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })}
            />
          </label>
          {salvar.isError && (
            <p className="maintenance-form-error" role="alert">
              {salvar.error.message}
            </p>
          )}
          <footer>
            <button type="button" onClick={aoFechar}>
              Voltar
            </button>
            <button
              className="maintenance-primary"
              disabled={salvar.isPending || Boolean(agendamentoExistente)}
              type="submit"
            >
              {salvar.isPending ? 'Salvando…' : 'Confirmar agendamento'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function hojeLocal() {
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset())
  return agora.toISOString().slice(0, 10)
}
function formatarDia(valor: string) {
  const [ano, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${ano}`
}
