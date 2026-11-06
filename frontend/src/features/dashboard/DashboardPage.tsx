import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, NavLink } from 'react-router-dom'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import SpeedRounded from '@mui/icons-material/SpeedRounded'
import EventRounded from '@mui/icons-material/EventRounded'
import { api } from '../../api/http'
import EmptyState from '../../shared/components/EmptyState'
import StatusBadge, { type NivelAlerta } from '../../shared/components/StatusBadge'
import { formatCalendarDate, formatDate, formatHours } from '../../shared/formatters'
import RegistrarLeituraDialog from '../leituras/RegistrarLeituraDialog'
import AgendarManutencaoDialog from '../manutencoes/AgendarManutencaoDialog'

interface Alerta {
  planoId: number
  nomePlano: string
  equipamentoId: number
  codigoEquipamento: string
  nomeEquipamento: string
  tipoEquipamento: string
  horimetroAtual: number
  proximoVencimento: number
  horasRestantes: number
  status: NivelAlerta
  dataReferencia: string | null
}

interface ManutencaoAgendada {
  id: number
  equipamentoId: number
  codigoEquipamento: string
  nomeEquipamento: string
  planoId: number | null
  nomePlano: string | null
  tipo: 'PREVENTIVA' | 'CORRETIVA'
  status: 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA'
  dataAgendada: string | null
  dataExecucao: string | null
  horimetroExecucao: number | null
  responsavel: string | null
  observacoes: string | null
  criadoEm: string
  atualizadoEm: string
}

interface DashboardResumo {
  planosVencidos: number
  planosProximos: number
  planosEmDia: number
  manutencoesAgendadasProximosSeteDias: number
  alertasCriticos: Alerta[]
  proximasManutencoes: ManutencaoAgendada[]
}

interface Pagina<T> { content: T[]; totalElements: number }
type FiltroAlerta = 'VENCIDA' | 'PROXIMA' | null
type DialogoPainel = { tipo: 'leitura' | 'agendar'; alerta: Alerta } | null
const ALERTAS_NO_PAINEL = 8

async function buscarResumo(): Promise<DashboardResumo> {
  return api.get<DashboardResumo>('/api/v1/dashboard/resumo')
}

export default function DashboardPage() {
  const [filtro, setFiltro] = useState<FiltroAlerta>(null)
  const [dialogo, setDialogo] = useState<DialogoPainel>(null)
  const { data, error, isPending, isError, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-resumo'],
    queryFn: buscarResumo,
  })
  // Vencidas e próximas juntas, já ordenadas pelo backend do menor restante (mais atrasado) para o maior.
  const alertasQuery = useQuery({
    queryKey: ['alertas', 'painel', filtro],
    queryFn: () => api.get<Pagina<Alerta>>(`/api/v1/alertas?size=${ALERTAS_NO_PAINEL}${filtro ? `&nivel=${filtro}` : ''}`),
  })
  const alternarFiltro = (nivel: Exclude<FiltroAlerta, null>) => setFiltro(atual => atual === nivel ? null : nivel)

  if (isPending) return <LoadingDashboard />
  if (isError) {
    return (
      <section className="state-card error-state" role="alert">
        <div className="state-symbol state-symbol--error">!</div>
        <div>
          <h2>Não foi possível carregar os dados</h2>
          <p>{error.message}</p>
          <button className="button button--secondary" onClick={() => void refetch()}>Tentar novamente</button>
        </div>
      </section>
    )
  }

  // Vencidas e Próximas filtram a tabela abaixo; Em dia e Agendadas levam às telas correspondentes.
  const cards: KpiCardProps[] = [
    { label: 'Vencidas', value: data.planosVencidos, tone: 'red', hint: filtro === 'VENCIDA' ? 'Filtrando a tabela' : 'Precisam de atenção', ativo: filtro === 'VENCIDA', aoClicar: () => alternarFiltro('VENCIDA') },
    { label: 'Próximas', value: data.planosProximos, tone: 'amber', hint: filtro === 'PROXIMA' ? 'Filtrando a tabela' : 'Dentro da antecedência', ativo: filtro === 'PROXIMA', aoClicar: () => alternarFiltro('PROXIMA') },
    { label: 'Em dia', value: data.planosEmDia, tone: 'green', hint: 'Dentro do intervalo', rota: '/planos' },
    { label: 'Agendadas', value: data.manutencoesAgendadasProximosSeteDias, tone: 'blue', hint: 'Próximos 7 dias', rota: '/manutencoes' },
  ]
  const alertas = alertasQuery.data
  const descricaoTabela = filtro === 'VENCIDA' ? 'Somente planos vencidos, do maior atraso para o menor.'
    : filtro === 'PROXIMA' ? 'Somente planos dentro da antecedência de alerta.'
      : 'Vencidos e próximos do vencimento, do maior atraso para o menor.'

  return (
    <div className="dashboard-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">ACOMPANHAMENTO OPERACIONAL</p>
          <h2>Visão geral</h2>
          <p className="page-description">Acompanhe os vencimentos e as próximas intervenções dos equipamentos.</p>
        </div>
        <button className="button button--secondary refresh-button" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshRounded className={isFetching ? 'spin' : ''} />
          Atualizar
        </button>
      </div>

      <section className="kpi-grid" aria-label="Resumo dos planos e manutenções">
        {cards.map((card) => <KpiCard key={card.label} {...card} />)}
      </section>

      <div className="dashboard-grid">
        <section className="panel alert-panel">
          <div className="panel-heading">
            <div>
              <h2>Planos que precisam de atenção</h2>
              <p>{descricaoTabela}</p>
            </div>
            <span className="panel-count">{alertas?.totalElements ?? '–'}</span>
          </div>
          {alertasQuery.isError ? (
            <div className="panel-inline-state" role="alert">
              <span>Não foi possível carregar os alertas.</span>
              <button className="button button--secondary" onClick={() => void alertasQuery.refetch()}>Tentar novamente</button>
            </div>
          ) : !alertas ? (
            <div className="panel-inline-state" aria-busy="true">Carregando alertas…</div>
          ) : (
            <>
              <AlertsTable
                alerts={alertas.content}
                aoRegistrarLeitura={alerta => setDialogo({ tipo: 'leitura', alerta })}
                aoAgendar={alerta => setDialogo({ tipo: 'agendar', alerta })}
              />
              {alertas.totalElements > alertas.content.length && (
                <Link className="panel-footer-link" to="/planos">
                  Ver todos os {alertas.totalElements} planos em alerta <ArrowForwardRounded />
                </Link>
              )}
            </>
          )}
        </section>

        <section className="panel schedule-panel">
          <div className="panel-heading">
            <div>
              <h2>Próximas manutenções</h2>
              <p>Agendamentos dos próximos 7 dias.</p>
            </div>
            <CalendarTodayOutlined className="panel-heading-icon" />
          </div>
          {data.proximasManutencoes.length === 0 ? (
            <EmptyState title="Nenhuma manutenção próxima" text="Os agendamentos para os próximos dias aparecerão aqui." />
          ) : (
            <ul className="schedule-list">
              {data.proximasManutencoes.map((item) => (
                <li className="schedule-item" key={item.id}>
                  <Link className="schedule-link" to="/manutencoes" aria-label={`Abrir manutenções: ${item.codigoEquipamento} ${item.nomeEquipamento}`}>
                  <div className="schedule-date">{formatDate(item.dataAgendada)}</div>
                  <div className="schedule-details">
                    <strong>{item.codigoEquipamento} · {item.nomeEquipamento}</strong>
                    <span>{item.nomePlano ?? 'Manutenção corretiva'} · {labelTipo(item.tipo)}</span>
                  </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="updated-at">Dados atualizados {formatUpdatedAt(dataUpdatedAt)}</p>

      {dialogo?.tipo === 'leitura' && (
        <RegistrarLeituraDialog
          equipamentoId={dialogo.alerta.equipamentoId}
          horimetroAtual={dialogo.alerta.horimetroAtual}
          aoFechar={() => setDialogo(null)}
        />
      )}
      {dialogo?.tipo === 'agendar' && (
        <AgendarManutencaoDialog
          equipamentoId={dialogo.alerta.equipamentoId}
          planoId={dialogo.alerta.planoId}
          aoFechar={() => setDialogo(null)}
        />
      )}
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: number
  tone: string
  hint: string
  /** Card que abre outra tela. */
  rota?: string
  /** Card que filtra a tabela de alertas (botão de alternância). */
  aoClicar?: () => void
  ativo?: boolean
}

function KpiCard({ label, value, tone, hint, rota, aoClicar, ativo }: KpiCardProps) {
  const conteudo = (
    <>
      <div className="kpi-topline">
        <span className="kpi-label">{label}</span>
        <span className="kpi-indicator" aria-hidden="true" />
      </div>
      <strong className="kpi-value">{value}</strong>
      <span className="kpi-hint">{hint}</span>
    </>
  )
  if (aoClicar) {
    return (
      <button type="button" onClick={aoClicar} aria-pressed={ativo}
        className={`kpi-card kpi-card--${tone} ${ativo ? 'kpi-card--active' : ''}`}
        aria-label={`${label}: ${value}. ${ativo ? 'Remover filtro' : 'Filtrar alertas'}`}>
        {conteudo}
      </button>
    )
  }
  return (
    <NavLink to={rota ?? '/'} className={`kpi-card kpi-card--${tone}`} aria-label={`${label}: ${value}. Abrir ${rota === '/planos' ? 'planos de manutenção' : 'manutenções'}`}>
      {conteudo}
    </NavLink>
  )
}

function AlertsTable({ alerts, aoRegistrarLeitura, aoAgendar }: {
  alerts: Alerta[]
  aoRegistrarLeitura: (alerta: Alerta) => void
  aoAgendar: (alerta: Alerta) => void
}) {
  if (alerts.length === 0) {
    return <EmptyState title="Tudo em dia" text="Nenhum plano ativo está vencido ou dentro da faixa de alerta." />
  }

  return (
    <div className="table-scroll">
      <table className="alerts-table">
        <thead>
          <tr>
            <th>Equipamento</th>
            <th>Plano</th>
            <th>Horímetro</th>
            <th>Restante</th>
            <th>Status</th>
            <th><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.planoId}>
              <td>
                <Link className="dashboard-item-link" to="/equipamentos" aria-label={`Abrir equipamentos: ${alert.codigoEquipamento} ${alert.nomeEquipamento}`}><strong className="equipment-code">{alert.codigoEquipamento}</strong>
                <span className="cell-secondary">{alert.nomeEquipamento}</span>
                </Link>
              </td>
              <td>
                <Link className="dashboard-item-link" to="/planos" aria-label={`Abrir planos: ${alert.nomePlano}`}><strong className="plan-name">{alert.nomePlano}</strong>
                <span className="cell-secondary">Vence em {formatHours(alert.proximoVencimento)}</span>
                <span className="cell-secondary">Referência: {formatCalendarDate(alert.dataReferencia)}</span>
                </Link>
              </td>
              <td>{formatHours(alert.horimetroAtual)}</td>
              <td className={alert.horasRestantes <= 0 ? 'remaining-overdue' : 'remaining-soon'}>
                {formatHours(alert.horasRestantes)}
              </td>
              <td><StatusBadge status={alert.status} /></td>
              <td>
                <div className="row-actions">
                  <button type="button" className="row-action" onClick={() => aoRegistrarLeitura(alert)} aria-label={`Registrar leitura de ${alert.codigoEquipamento}`}>
                    <SpeedRounded /> Leitura
                  </button>
                  <button type="button" className="row-action" onClick={() => aoAgendar(alert)} aria-label={`Agendar ${alert.nomePlano} de ${alert.codigoEquipamento}`}>
                    <EventRounded /> Agendar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoadingDashboard() {
  return (
    <div className="dashboard-page" aria-label="Carregando painel" aria-busy="true">
      <div className="loading-heading skeleton" />
      <div className="kpi-grid">{[1, 2, 3, 4].map((item) => <div className="kpi-card skeleton" key={item} />)}</div>
      <div className="loading-panels">
        <div className="panel skeleton" />
        <div className="panel skeleton" />
      </div>
    </div>
  )
}

function formatUpdatedAt(timestamp: number) {
  if (!timestamp) return 'ao abrir a página'
  return `às ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(timestamp)}`
}

function labelTipo(tipo: ManutencaoAgendada['tipo']) {
  return tipo === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva'
}
