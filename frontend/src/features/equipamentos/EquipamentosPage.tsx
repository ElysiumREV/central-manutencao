import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AddRounded from '@mui/icons-material/AddRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { api } from '../../api/http'
import type { Equipamento, Pagina, StatusEquipamento } from '../../api/tipos'
import { formatHours } from '../../shared/formatters'
import './EquipamentosPage.css'

interface FormularioEquipamento {
  codigo: string
  nome: string
  tipo: string
  fabricante: string
  modelo: string
  numeroSerie: string
  localizacao: string
  horimetroInicial: string
  status: StatusEquipamento
}

const formularioVazio: FormularioEquipamento = {
  codigo: '',
  nome: '',
  tipo: '',
  fabricante: '',
  modelo: '',
  numeroSerie: '',
  localizacao: '',
  horimetroInicial: '0',
  status: 'ATIVO',
}

function buscarEquipamentos(termo: string, status: string, pagina: number) {
  const params = new URLSearchParams({ page: String(pagina), size: '10', sort: 'nome,asc' })
  if (termo) params.set('termo', termo)
  if (status) params.set('status', status)
  return api.get<Pagina<Equipamento>>(`/api/v1/equipamentos?${params.toString()}`)
}

export default function EquipamentosPage() {
  const queryClient = useQueryClient()
  const [termoRascunho, setTermoRascunho] = useState('')
  const [termo, setTermo] = useState('')
  const [status, setStatus] = useState('')
  const [pagina, setPagina] = useState(0)
  const [formularioAberto, setFormularioAberto] = useState(false)
  const [confirmarInativacao, setConfirmarInativacao] = useState<Equipamento | null>(null)
  const [editando, setEditando] = useState<Equipamento | null>(null)
  const [formulario, setFormulario] = useState(formularioVazio)

  const equipamentosQuery = useQuery({
    queryKey: ['equipamentos', termo, status, pagina],
    queryFn: () => buscarEquipamentos(termo, status, pagina),
  })

  const salvarMutation = useMutation({
    mutationFn: () => {
      const dados = {
        codigo: formulario.codigo,
        nome: formulario.nome,
        tipo: formulario.tipo,
        fabricante: formulario.fabricante || null,
        modelo: formulario.modelo || null,
        numeroSerie: formulario.numeroSerie || null,
        localizacao: formulario.localizacao || null,
      }
      if (editando) {
        return api.put<Equipamento>(`/api/v1/equipamentos/${editando.id}`, {
          ...dados,
          status: formulario.status,
        })
      }
      return api.post<Equipamento>('/api/v1/equipamentos', {
        ...dados,
        horimetroInicial: Number(formulario.horimetroInicial),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
      fecharFormulario()
    },
  })

  const inativarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/equipamentos/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['equipamentos'] })
      setConfirmarInativacao(null)
    },
  })

  function abrirNovo() {
    setEditando(null)
    setFormulario(formularioVazio)
    salvarMutation.reset()
    setFormularioAberto(true)
  }

  function abrirEdicao(equipamento: Equipamento) {
    setEditando(equipamento)
    setFormulario({
      codigo: equipamento.codigo,
      nome: equipamento.nome,
      tipo: equipamento.tipo,
      fabricante: equipamento.fabricante ?? '',
      modelo: equipamento.modelo ?? '',
      numeroSerie: equipamento.numeroSerie ?? '',
      localizacao: equipamento.localizacao ?? '',
      horimetroInicial: String(equipamento.horimetroAtual),
      status: equipamento.status,
    })
    salvarMutation.reset()
    setFormularioAberto(true)
  }

  function fecharFormulario() {
    setFormularioAberto(false)
    setEditando(null)
    setFormulario(formularioVazio)
    salvarMutation.reset()
  }

  function aplicarBusca(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTermo(termoRascunho.trim())
    setPagina(0)
  }

  function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    salvarMutation.mutate()
  }

  const equipamentos = equipamentosQuery.data?.content ?? []

  return (
    <section className="equipment-page">
      <div className="equipment-heading">
        <div>
          <p className="equipment-eyebrow">CADASTRO E OPERAÇÃO</p>
          <h2>Equipamentos</h2>
          <p>Consulte e mantenha os dados dos equipamentos monitorados.</p>
        </div>
        <button className="equipment-button equipment-button--primary" onClick={abrirNovo}>
          <AddRounded /> Novo equipamento
        </button>
      </div>

      <section className="equipment-panel">
        <form className="equipment-filters" onSubmit={aplicarBusca}>
          <label className="equipment-search">
            <span className="sr-only">Buscar por TAG ou nome</span>
            <SearchRounded />
            <input
              value={termoRascunho}
              onChange={event => setTermoRascunho(event.target.value)}
              placeholder="Buscar por TAG ou nome"
            />
          </label>
          <label className="equipment-status-filter">
            <span className="sr-only">Filtrar por status</span>
            <select
              value={status}
              onChange={event => {
                setStatus(event.target.value)
                setPagina(0)
              }}
            >
              <option value="">Todos os status</option>
              <option value="ATIVO">Ativo</option>
              <option value="EM_MANUTENCAO">Em manutenção</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </label>
          <button className="equipment-button equipment-button--secondary" type="submit">
            Buscar
          </button>
          {equipamentosQuery.data && (
            <span className="equipment-total">{equipamentosQuery.data.totalElements} equipamentos</span>
          )}
        </form>

        {equipamentosQuery.isPending ? (
          <div className="equipment-loading" aria-label="Carregando equipamentos">
            <span />
            <span />
            <span />
          </div>
        ) : equipamentosQuery.isError ? (
          <div className="equipment-message equipment-message--error" role="alert">
            <strong>Não foi possível carregar os equipamentos.</strong>
            <span>{equipamentosQuery.error.message}</span>
            <button
              className="equipment-button equipment-button--secondary"
              onClick={() => void equipamentosQuery.refetch()}
            >
              Tentar novamente
            </button>
          </div>
        ) : equipamentos.length === 0 ? (
          <div className="equipment-message">
            <strong>{termo || status ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado'}</strong>
            <span>
              {termo || status
                ? 'Altere os filtros ou a busca e tente novamente.'
                : 'Cadastre o primeiro equipamento para iniciar o monitoramento.'}
            </span>
            {!termo && !status && (
              <button className="equipment-button equipment-button--secondary" onClick={abrirNovo}>
                Cadastrar equipamento
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="equipment-table-scroll">
              <table className="equipment-table">
                <thead>
                  <tr>
                    <th>Equipamento</th>
                    <th>Tipo</th>
                    <th>Localização</th>
                    <th>Horímetro</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {equipamentos.map(equipamento => (
                    <tr key={equipamento.id}>
                      <td>
                        <strong className="equipment-tag">{equipamento.codigo}</strong>
                        <span className="equipment-subtext">{equipamento.nome}</span>
                      </td>
                      <td>{equipamento.tipo}</td>
                      <td>{equipamento.localizacao || '—'}</td>
                      <td className="equipment-hours">{formatHours(equipamento.horimetroAtual)}</td>
                      <td>
                        <StatusPill status={equipamento.status} />
                      </td>
                      <td className="equipment-actions">
                        <button
                          className="equipment-icon-button"
                          title="Editar equipamento"
                          aria-label={`Editar ${equipamento.codigo}`}
                          onClick={() => abrirEdicao(equipamento)}
                        >
                          <EditOutlined />
                        </button>
                        {equipamento.status !== 'INATIVO' && (
                          <button className="equipment-text-button" onClick={() => setConfirmarInativacao(equipamento)}>
                            Inativar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="equipment-pagination">
              <span>
                Página {pagina + 1} de {Math.max(equipamentosQuery.data.totalPages, 1)}
              </span>
              <div>
                <button
                  className="equipment-button equipment-button--secondary"
                  disabled={pagina === 0}
                  onClick={() => setPagina(valor => valor - 1)}
                >
                  Anterior
                </button>
                <button
                  className="equipment-button equipment-button--secondary"
                  disabled={pagina + 1 >= equipamentosQuery.data.totalPages}
                  onClick={() => setPagina(valor => valor + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {formularioAberto && (
        <Modal title={editando ? 'Editar equipamento' : 'Novo equipamento'} fechar={fecharFormulario}>
          <form className="equipment-form" onSubmit={enviarFormulario}>
            <p className="form-intro">
              {editando
                ? 'Atualize os dados cadastrais. O horímetro é atualizado pelo registro de leitura.'
                : 'Informe os dados principais do equipamento para começar o monitoramento.'}
            </p>
            <div className="equipment-form-grid">
              <label>
                TAG / Código{' '}
                <input
                  required
                  maxLength={50}
                  value={formulario.codigo}
                  onChange={e => setFormulario({ ...formulario, codigo: e.target.value })}
                />
              </label>
              <label>
                Nome{' '}
                <input
                  required
                  maxLength={150}
                  value={formulario.nome}
                  onChange={e => setFormulario({ ...formulario, nome: e.target.value })}
                />
              </label>
              <label>
                Tipo{' '}
                <input
                  required
                  maxLength={80}
                  value={formulario.tipo}
                  onChange={e => setFormulario({ ...formulario, tipo: e.target.value })}
                />
              </label>
              <label>
                Localização{' '}
                <input
                  maxLength={150}
                  value={formulario.localizacao}
                  onChange={e => setFormulario({ ...formulario, localizacao: e.target.value })}
                />
              </label>
              <label>
                Fabricante{' '}
                <input
                  maxLength={100}
                  value={formulario.fabricante}
                  onChange={e => setFormulario({ ...formulario, fabricante: e.target.value })}
                />
              </label>
              <label>
                Modelo{' '}
                <input
                  maxLength={100}
                  value={formulario.modelo}
                  onChange={e => setFormulario({ ...formulario, modelo: e.target.value })}
                />
              </label>
              <label>
                Número de série{' '}
                <input
                  maxLength={100}
                  value={formulario.numeroSerie}
                  onChange={e => setFormulario({ ...formulario, numeroSerie: e.target.value })}
                />
              </label>
              {editando ? (
                <label>
                  Status
                  <select
                    value={formulario.status}
                    onChange={e => setFormulario({ ...formulario, status: e.target.value as StatusEquipamento })}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="EM_MANUTENCAO">Em manutenção</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </label>
              ) : (
                <label>
                  Horímetro inicial (h)
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.1"
                    value={formulario.horimetroInicial}
                    onChange={e => setFormulario({ ...formulario, horimetroInicial: e.target.value })}
                  />
                </label>
              )}
            </div>
            {salvarMutation.isError && (
              <p className="form-error" role="alert">
                {mensagemErro(salvarMutation.error)}
              </p>
            )}
            <div className="equipment-form-actions">
              <button className="equipment-button equipment-button--secondary" type="button" onClick={fecharFormulario}>
                Cancelar
              </button>
              <button
                className="equipment-button equipment-button--primary"
                disabled={salvarMutation.isPending}
                type="submit"
              >
                {salvarMutation.isPending ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar equipamento'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmarInativacao && (
        <Modal title="Inativar equipamento" fechar={() => setConfirmarInativacao(null)}>
          <div className="confirm-content">
            <p>
              O equipamento{' '}
              <strong>
                {confirmarInativacao.codigo} · {confirmarInativacao.nome}
              </strong>{' '}
              será marcado como inativo. O histórico será preservado.
            </p>
            {inativarMutation.isError && (
              <p className="form-error" role="alert">
                {mensagemErro(inativarMutation.error)}
              </p>
            )}
            <div className="equipment-form-actions">
              <button
                className="equipment-button equipment-button--secondary"
                onClick={() => setConfirmarInativacao(null)}
              >
                Cancelar
              </button>
              <button
                className="equipment-button equipment-button--danger"
                disabled={inativarMutation.isPending}
                onClick={() => inativarMutation.mutate(confirmarInativacao.id)}
              >
                {inativarMutation.isPending ? 'Inativando…' : 'Confirmar inativação'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

function Modal({ title, fechar, children }: { title: string; fechar: () => void; children: ReactNode }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) fechar()
      }}
    >
      <section className="equipment-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="equipment-icon-button" aria-label="Fechar" onClick={fechar}>
            <CloseRounded />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function StatusPill({ status }: { status: StatusEquipamento }) {
  const labels: Record<StatusEquipamento, string> = {
    ATIVO: 'Ativo',
    EM_MANUTENCAO: 'Em manutenção',
    INATIVO: 'Inativo',
  }
  return <span className={`equipment-status equipment-status--${status.toLowerCase()}`}>{labels[status]}</span>
}

// A API devolve a explicação em `detail` (ProblemDetail); o cliente HTTP já a coloca em `message`.
function mensagemErro(erro: Error) {
  return erro.message
}
