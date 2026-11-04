import { useState, type FormEvent } from 'react'
import { ApiError, api, definirCredenciais, limparCredenciais } from '../../api/http'
import './LoginPage.css'

export default function LoginPage({ aoAutenticar }: { aoAutenticar: () => void }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setCarregando(true)
    definirCredenciais(usuario, senha)
    try {
      await api.get<{ usuario: string }>('/api/v1/auth/session')
      aoAutenticar()
    } catch (falha) {
      limparCredenciais()
      setErro(falha instanceof ApiError && falha.status === 401
        ? 'Usuário ou senha inválidos.'
        : 'Não foi possível autenticar. Confira se a API está disponível.')
    } finally {
      setCarregando(false)
    }
  }

  return <main className="login-page">
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-brand-mark" aria-hidden="true">M</div>
      <p className="login-eyebrow">CENTRAL DE MONITORAMENTO</p>
      <h1 id="login-title">Acesse sua conta</h1>
      <p className="login-description">Entre para acompanhar equipamentos e manutenções preventivas.</p>
      <form onSubmit={event => void entrar(event)}>
        <label>Usuário<input autoComplete="username" required value={usuario} onChange={event => setUsuario(event.target.value)} /></label>
        <label>Senha<input autoComplete="current-password" required type="password" value={senha} onChange={event => setSenha(event.target.value)} /></label>
        {erro && <p className="login-error" role="alert">{erro}</p>}
        <button type="submit" disabled={carregando}>{carregando ? 'Verificando…' : 'Entrar'}</button>
      </form>
      <p className="login-security-note">Acesso protegido por autenticação HTTP Basic.</p>
    </section>
  </main>
}
