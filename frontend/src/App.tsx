import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'
import SpeedOutlined from '@mui/icons-material/SpeedOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import MenuRounded from '@mui/icons-material/MenuRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import AddRounded from '@mui/icons-material/AddRounded'
import SpeedRounded from '@mui/icons-material/SpeedRounded'
import EventRounded from '@mui/icons-material/EventRounded'
import { api, limparCredenciais, possuiCredenciais } from './api/http'
import LoginPage from './features/auth/LoginPage'
import EquipamentosPage from './features/equipamentos/EquipamentosPage'
import PlanosPage from './features/planos/PlanosPage'
import LeiturasPage from './features/leituras/LeiturasPage'
import ManutencoesPage from './features/manutencoes/ManutencoesPage'
import RegistrarLeituraDialog from './features/leituras/RegistrarLeituraDialog'
import AgendarManutencaoDialog from './features/manutencoes/AgendarManutencaoDialog'
import './App.css'

type NivelAlerta = 'VENCIDA' | 'PROXIMA' | 'EM_DIA'

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

const navegacao = [
  { texto: 'Painel', rota: '/', icone: <DashboardOutlined /> },
  { texto: 'Equipamentos', rota: '/equipamentos', icone: <Inventory2Outlined /> },
  { texto: 'Planos', rota: '/planos', icone: <AssignmentOutlined /> },
  { texto: 'Leituras', rota: '/leituras', icone: <SpeedOutlined /> },
  { texto: 'Manutenções', rota: '/manutencoes', icone: <BuildOutlined /> },
]

const titulos: Record<string, string> = {
  '/': 'Painel de monitoramento',
  '/equipamentos': 'Equipamentos',
  '/planos': 'Planos de manutenção',
  '/leituras': 'Leituras de horímetro',
  '/manutencoes': 'Manutenções',
}

function App() {
  const queryClient = useQueryClient()
  // Sem credenciais em memória já começa anônimo; só há o que verificar quando existem credenciais.
  const [estadoAutenticacao, setEstadoAutenticacao] = useState<'verificando' | 'anonimo' | 'autenticado'>(
    () => possuiCredenciais() ? 'verificando' : 'anonimo')

  useEffect(() => {
    if (!possuiCredenciais()) return
    let ativo = true
    api.get<{ usuario: string }>('/api/v1/auth/session')
      .then(() => { if (ativo) setEstadoAutenticacao('autenticado') })
      .catch(() => {
        limparCredenciais()
        if (ativo) setEstadoAutenticacao('anonimo')
      })
    return () => { ativo = false }
  }, [])

  function sair() {
    limparCredenciais()
    queryClient.clear()
    setEstadoAutenticacao('anonimo')
  }

  if (estadoAutenticacao === 'verificando') return <div className="auth-loading">Verificando acesso…</div>
  if (estadoAutenticacao === 'anonimo') return <LoginPage aoAutenticar={() => setEstadoAutenticacao('autenticado')} />
  return <AppShell aoSair={sair} />
}

function AppShell({ aoSair }: { aoSair: () => void }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [leituraRapida, setLeituraRapida] = useState(false)
  const location = useLocation()
  const titulo = titulos[location.pathname] ?? 'Central de manutenção'

  return (
    <div className="app-shell">
      {menuAberto && <button className="drawer-backdrop" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />}
      <aside className={`sidebar ${menuAberto ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">M</div>
          <div>
            <strong>Manutenção</strong>
            <span>Central de monitoramento</span>
          </div>
          <button className="mobile-close icon-button" aria-label="Fechar menu" onClick={() => setMenuAberto(false)}>
            <CloseRounded />
          </button>
        </div>

        <span className="nav-caption">MENU PRINCIPAL</span>
        <nav className="navigation" aria-label="Navegação principal">
          {navegacao.map((item) => (
            <NavLink
              key={item.rota}
              to={item.rota}
              end={item.rota === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
              onClick={() => setMenuAberto(false)}
            >
              <span className="nav-icon">{item.icone}</span>
              <span>{item.texto}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="connection-dot" />
          <span>Monitoramento preventivo</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}>
            <MenuRounded />
          </button>
          <div className="topbar-title">
            <span>Central de manutenção</span>
            <h1>{titulo}</h1>
          </div>
          <button className="quick-reading-button" onClick={() => setLeituraRapida(true)} aria-label="Registrar leitura"><AddRounded /> <span>Leitura</span></button>
          <a className="api-link" href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer">
            API <ArrowForwardRounded />
          </a>
          <button className="logout-button" onClick={aoSair}><LogoutOutlined /> Sair</button>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/equipamentos" element={<EquipamentosPage />} />
            <Route path="/planos" element={<PlanosPage />} />
            <Route path="/leituras" element={<LeiturasPage />} />
            <Route path="/manutencoes" element={<ManutencoesPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </div>
      </main>
      {leituraRapida && <RegistrarLeituraDialog aoFechar={() => setLeituraRapida(false)} />}
    </div>
  )
}

function DashboardPage() {
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

function StatusBadge({ status }: { status: NivelAlerta }) {
  const labels: Record<NivelAlerta, string> = { VENCIDA: 'Vencida', PROXIMA: 'Próxima', EM_DIA: 'Em dia' }
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{labels[status]}</span>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><AccessTimeRounded /></div>
      <strong>{title}</strong>
      <span>{text}</span>
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

function formatHours(value: number) {
  const formatted = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Math.abs(value))
  return `${value < 0 ? '−' : ''}${formatted} h`
}

function formatDate(value: string | null) {
  if (!value) return 'Data não definida'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(year, month - 1, day))
}

function formatCalendarDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
}

function formatUpdatedAt(timestamp: number) {
  if (!timestamp) return 'ao abrir a página'
  return `às ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(timestamp)}`
}

function labelTipo(tipo: ManutencaoAgendada['tipo']) {
  return tipo === 'PREVENTIVA' ? 'Preventiva' : 'Corretiva'
}

export default App
