import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AddRounded from '@mui/icons-material/AddRounded'
import { api } from '../../api/http'
import type { Leitura, Pagina } from '../../api/tipos'
import { formatDateTime as formatarData, formatHours as horas } from '../../shared/formatters'
import RegistrarLeituraDialog from './RegistrarLeituraDialog'
import './LeiturasPage.css'


export default function LeiturasPage() {
  const [pagina, setPagina] = useState(0)
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [modal, setModal] = useState(false)
  const params = new URLSearchParams({ page: String(pagina), size: '15', sort: 'dataHora,desc' })
  if (de) params.set('de', new Date(`${de}T00:00:00`).toISOString())
  if (ate) params.set('ate', new Date(`${ate}T23:59:59.999`).toISOString())
  const leiturasQuery = useQuery({ queryKey: ['leituras', de, ate, pagina], queryFn: () => api.get<Pagina<Leitura>>(`/api/v1/leituras?${params}`) })
  function abrir() { setModal(true) }
  const leituras = leiturasQuery.data?.content ?? []
  const erro = leiturasQuery.isError

  return <section className="readings-page">
    <header className="readings-heading"><div><p className="readings-eyebrow">HISTÓRICO OPERACIONAL</p><h2>Leituras de horímetro</h2><p>Registre novas medições e acompanhe a evolução dos equipamentos.</p></div><button className="readings-primary" onClick={abrir}><AddRounded /> Registrar leitura</button></header>
    <section className="readings-panel">
      <form className="readings-filters" onSubmit={event => { event.preventDefault(); setPagina(0); void leiturasQuery.refetch() }}><label>De<input type="date" value={de} onChange={e => setDe(e.target.value)} /></label><label>Até<input type="date" value={ate} onChange={e => setAte(e.target.value)} /></label><button type="submit">Filtrar período</button><span>{leiturasQuery.data?.totalElements ?? 0} leituras</span></form>
      {erro ? <div className="readings-state readings-error" role="alert"><strong>Não foi possível carregar as leituras.</strong><button onClick={() => { void leiturasQuery.refetch() }}>Tentar novamente</button></div>
        : leiturasQuery.isPending ? <div className="readings-state">Carregando histórico…</div>
          : leituras.length === 0 ? <div className="readings-state"><strong>Nenhuma leitura encontrada</strong><span>Registre uma leitura ou altere o período selecionado.</span><button onClick={abrir}>Registrar leitura</button></div>
            : <><div className="readings-table-wrap"><table className="readings-table"><thead><tr><th>Data e hora</th><th>Equipamento</th><th>Horímetro registrado</th><th>Responsável</th><th>Observação</th></tr></thead><tbody>{leituras.map(leitura => <tr key={leitura.id}><td>{formatarData(leitura.dataHora)}</td><td><strong>{leitura.codigoEquipamento}</strong><small>{leitura.nomeEquipamento}</small></td><td className="reading-hours">{horas(leitura.valor)}</td><td>{leitura.responsavel}</td><td className="reading-observation">{leitura.observacao || '—'}</td></tr>)}</tbody></table></div><footer className="readings-pagination"><span>Página {pagina + 1} de {Math.max(leiturasQuery.data?.totalPages ?? 1, 1)}</span><div><button disabled={!pagina} onClick={() => setPagina(p => p - 1)}>Anterior</button><button disabled={pagina + 1 >= (leiturasQuery.data?.totalPages ?? 0)} onClick={() => setPagina(p => p + 1)}>Próxima</button></div></footer></>}
    </section>
    {modal && <RegistrarLeituraDialog aoFechar={() => setModal(false)} />}
  </section>
}
