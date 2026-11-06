import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'
import SpeedOutlined from '@mui/icons-material/SpeedOutlined'
import BuildOutlined from '@mui/icons-material/BuildOutlined'
import MenuRounded from '@mui/icons-material/MenuRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import AddRounded from '@mui/icons-material/AddRounded'
import { api, limparCredenciais, possuiCredenciais } from './api/http'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import EquipamentosPage from './features/equipamentos/EquipamentosPage'
import PlanosPage from './features/planos/PlanosPage'
import LeiturasPage from './features/leituras/LeiturasPage'
import ManutencoesPage from './features/manutencoes/ManutencoesPage'
import RegistrarLeituraDialog from './features/leituras/RegistrarLeituraDialog'
import './App.css'

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
          <div className="topbar-actions">
            <button className="quick-reading-button" onClick={() => setLeituraRapida(true)} aria-label="Registrar leitura"><AddRounded /> <span>Leitura</span></button>
            <a className="api-link" href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer"
              title="Documentação da API (Swagger), abre em nova aba" aria-label="Documentação da API, abre em nova aba">
              <OpenInNewRounded /> <span>API</span>
            </a>
            <button className="logout-button" onClick={aoSair}><LogoutOutlined /> Sair</button>
          </div>
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

export default App
