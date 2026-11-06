import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { Equipamento, Manutencao, Pagina, Plano, TipoManutencao } from '../../api/tipos'
import { formatHours } from '../../shared/formatters'
import './ManutencoesPage.css'

/**
 * Registro de uma manutenção já realizada, sem agendamento prévio (ex.: corretiva de emergência ou
 * preventiva feita em campo). Usa `POST /api/v1/manutencoes/concluidas`.
 *
 * Se for preventiva, o backend atualiza a última execução do plano e recalcula o próximo vencimento,
 * como na conclusão de um agendamento.
 */
export default function RegistrarManutencaoDialog({ aoFechar }: { aoFechar: () => void }) {
  const client = useQueryClient()
  const [form, setForm] = useState({
    equipamentoId: '',
    planoId: '',
    tipo: 'CORRETIVA' as TipoManutencao,
    dataExecucao: agoraLocal(),
    horimetroExecucao: '',
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
    enabled: Boolean(form.equipamentoId) && form.tipo === 'PREVENTIVA',
  })
  const equipamento = equipamentosQuery.data?.content.find(item => item.id === Number(form.equipamentoId))
  const plano = planosQuery.data?.content.find(item => item.id === Number(form.planoId))

  const salvar = useMutation({
    mutationFn: () =>
      api.post<Manutencao>('/api/v1/manutencoes/concluidas', {
        equipamentoId: Number(form.equipamentoId),
        planoId: form.tipo === 'PREVENTIVA' ? Number(form.planoId) : null,
        tipo: form.tipo,
        dataExecucao: new Date(form.dataExecucao).toISOString(),
        horimetroExecucao: Number(form.horimetroExecucao),
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

  function escolherEquipamento(id: string) {
    const escolhido = equipamentosQuery.data?.content.find(item => item.id === Number(id))
    setForm({
      ...form,
      equipamentoId: id,
      planoId: '',
      horimetroExecucao: escolhido ? String(escolhido.horimetroAtual) : '',
    })
  }

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
      <section className="maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="register-dialog-title">
        <header>
          <h2 id="register-dialog-title">Registrar manutenção realizada</h2>
          <button aria-label="Fechar" onClick={aoFechar}>
            ×
          </button>
        </header>
        <form onSubmit={enviar}>
          <p>
            Para serviços já executados sem agendamento. Em uma preventiva, o plano passa a contar o próximo vencimento
            a partir do horímetro informado.
          </p>
          <label>
            Equipamento
            <select required value={form.equipamentoId} onChange={e => escolherEquipamento(e.target.value)}>
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
            <select
              value={form.tipo}
              onChange={e => setForm({ ...form, tipo: e.target.value as TipoManutencao, planoId: '' })}
            >
              <option value="CORRETIVA">Corretiva</option>
              <option value="PREVENTIVA">Preventiva</option>
            </select>
          </label>
          {form.tipo === 'PREVENTIVA' && (
            <label>
              Plano
              <select required value={form.planoId} onChange={e => setForm({ ...form, planoId: e.target.value })}>
                <option value="">Selecione um plano ativo</option>
                {(planosQuery.data?.content ?? []).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="maintenance-form-grid">
            <label>
              Data e hora
              <input
                type="datetime-local"
                required
                max={agoraLocal()}
                value={form.dataExecucao}
                onChange={e => setForm({ ...form, dataExecucao: e.target.value })}
              />
            </label>
            <label>
              Horímetro da execução
              <input
                type="number"
                required
                step="0.1"
                min={plano?.horimetroUltimaExecucao ?? 0}
                max={equipamento?.horimetroAtual}
                value={form.horimetroExecucao}
                onChange={e => setForm({ ...form, horimetroExecucao: e.target.value })}
              />
            </label>
          </div>
          {equipamento && (
            <p className="maintenance-form-hint">
              Horímetro atual: {formatHours(equipamento.horimetroAtual)}
              {plano ? ` · última execução do plano: ${formatHours(plano.horimetroUltimaExecucao)}` : ''}
            </p>
          )}
          <label>
            Responsável
            <input
              required
              maxLength={120}
              value={form.responsavel}
              onChange={e => setForm({ ...form, responsavel: e.target.value })}
            />
          </label>
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
            <button className="maintenance-primary" disabled={salvar.isPending} type="submit">
              {salvar.isPending ? 'Salvando…' : 'Registrar manutenção'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function agoraLocal() {
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset())
  return agora.toISOString().slice(0, 16)
}
