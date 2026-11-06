import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AddRounded from '@mui/icons-material/AddRounded'
import { api } from '../../api/http'
import AgendarManutencaoDialog from './AgendarManutencaoDialog'
import './ManutencoesPage.css'

type Status = 'AGENDADA' | 'CONCLUIDA' | 'CANCELADA'
type Tipo = 'PREVENTIVA' | 'CORRETIVA'
interface Manutencao { id:number; equipamentoId:number; codigoEquipamento:string; nomeEquipamento:string; planoId:number|null; nomePlano:string|null; tipo:Tipo; status:Status; dataAgendada:string|null; dataExecucao:string|null; horimetroExecucao:number|null; responsavel:string|null; observacoes:string|null }
interface Equipamento { id:number; codigo:string; nome:string; status:string; horimetroAtual:number }
interface Pagina<T> { content:T[]; totalElements:number; totalPages:number }
type Acao = { tipo:'agendar' } | { tipo:'concluir'; manutencao:Manutencao } | { tipo:'cancelar'; manutencao:Manutencao }

export default function ManutencoesPage() {
  const client=useQueryClient(); const [statusFiltro,setStatusFiltro]=useState('AGENDADA'); const [ordem,setOrdem]=useState<Ordem>('prazo-asc'); const [pagina,setPagina]=useState(0); const [acao,setAcao]=useState<Acao|null>(null)
  const [form,setForm]=useState({ equipamentoId:'', planoId:'', tipo:'PREVENTIVA' as Tipo, dataAgendada:'', dataExecucao:agoraLocal(), horimetroExecucao:'', responsavel:'', observacoes:'' })
  const equipamentosQuery=useQuery({queryKey:['equipamentos-opcoes'],queryFn:()=>api.get<Pagina<Equipamento>>('/api/v1/equipamentos?size=100&sort=nome,asc')})
  const params=new URLSearchParams({page:String(pagina),size:'10',sort:ORDENS[ordem].sort}); params.append('sort','id,asc'); if(statusFiltro)params.set('status',statusFiltro)
  const manutencoesQuery=useQuery({queryKey:['manutencoes',statusFiltro,ordem,pagina],queryFn:()=>api.get<Pagina<Manutencao>>(`/api/v1/manutencoes?${params}`)})
  const equipment=equipamentosQuery.data?.content.find(item=>item.id===Number(form.equipamentoId))
  const atualizarDados=async()=>{await Promise.all([client.invalidateQueries({queryKey:['manutencoes']}),client.invalidateQueries({queryKey:['planos']}),client.invalidateQueries({queryKey:['dashboard-resumo']}),client.invalidateQueries({queryKey:['alertas']}),client.invalidateQueries({queryKey:['equipamentos-opcoes']})])}
  const salvar=useMutation({mutationFn:()=>{
    if(acao?.tipo==='concluir')return api.post<Manutencao>(`/api/v1/manutencoes/${acao.manutencao.id}/concluir`,{dataExecucao:new Date(form.dataExecucao).toISOString(),horimetroExecucao:Number(form.horimetroExecucao),observacoes:form.observacoes||null})
    if(acao?.tipo==='cancelar')return api.post<Manutencao>(`/api/v1/manutencoes/${acao.manutencao.id}/cancelar`,{motivo:form.observacoes||null})
    throw new Error('Ação não selecionada.')
  },onSuccess:async()=>{await atualizarDados();fechar()}})
  function limparForm(){setForm({equipamentoId:'',planoId:'',tipo:'PREVENTIVA',dataAgendada:'',dataExecucao:agoraLocal(),horimetroExecucao:'',responsavel:'',observacoes:''})}
  function abrirAgendamento(){salvar.reset();limparForm();setAcao({tipo:'agendar'})}
  function abrirConclusao(item:Manutencao){salvar.reset();setForm({...form,equipamentoId:String(item.equipamentoId),planoId:item.planoId?String(item.planoId):'',tipo:item.tipo,dataExecucao:agoraLocal(),horimetroExecucao:String(equipamentosQuery.data?.content.find(e=>e.id===item.equipamentoId)?.horimetroAtual??0),responsavel:item.responsavel??'',observacoes:item.observacoes??''});setAcao({tipo:'concluir',manutencao:item})}
  function abrirCancelamento(item:Manutencao){salvar.reset();setForm({...form,observacoes:''});setAcao({tipo:'cancelar',manutencao:item})}
  function fechar(){setAcao(null);salvar.reset();limparForm()}
  function enviar(event:FormEvent){event.preventDefault();salvar.mutate()}
  const itens=manutencoesQuery.data?.content??[]
  const erro=manutencoesQuery.isError||equipamentosQuery.isError

  return <section className="maintenance-page">
    <header className="maintenance-heading"><div><p className="maintenance-eyebrow">AGENDA E HISTÓRICO</p><h2>Manutenções</h2><p>Agende intervenções e registre a conclusão dos serviços.</p></div><button className="maintenance-primary" onClick={abrirAgendamento}><AddRounded/> Agendar manutenção</button></header>
    <section className="maintenance-panel"><div className="maintenance-filters"><label>Status<select value={statusFiltro} onChange={e=>{const status=e.target.value;setStatusFiltro(status);if(!ordensDisponiveis(status).includes(ordem))setOrdem('prazo-asc');setPagina(0)}}><option value="AGENDADA">Agendadas</option><option value="CONCLUIDA">Concluídas</option><option value="CANCELADA">Canceladas</option><option value="">Todas</option></select></label><label>Ordenar por<select value={ordem} onChange={e=>{setOrdem(e.target.value as Ordem);setPagina(0)}}>{ordensDisponiveis(statusFiltro).map(chave=><option key={chave} value={chave}>{ORDENS[chave].label}</option>)}</select></label><span>{manutencoesQuery.data?.totalElements??0} registros</span></div>
      {erro?<div className="maintenance-state maintenance-error" role="alert"><strong>Não foi possível carregar as manutenções.</strong><button onClick={()=>{void manutencoesQuery.refetch();void equipamentosQuery.refetch()}}>Tentar novamente</button></div>:manutencoesQuery.isPending||equipamentosQuery.isPending?<div className="maintenance-state">Carregando manutenções…</div>:itens.length===0?<div className="maintenance-state"><strong>Nenhuma manutenção encontrada</strong><span>Agende uma manutenção ou selecione outro status.</span><button onClick={abrirAgendamento}>Agendar manutenção</button></div>:<><div className="maintenance-table-wrap"><table className="maintenance-table"><thead><tr><th>Data</th><th>Equipamento</th><th>Serviço</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead><tbody>{itens.map(item=><tr key={item.id}><td>{item.status==='AGENDADA'?formatarDia(item.dataAgendada):item.dataExecucao?formatarData(item.dataExecucao):'—'}</td><td><strong>{item.codigoEquipamento}</strong><small>{item.nomeEquipamento}</small></td><td><strong>{item.tipo==='PREVENTIVA'?'Preventiva':'Corretiva'}</strong><small>{item.nomePlano??'Sem plano vinculado'}</small></td><td>{item.responsavel??'—'}</td><td><span className={`maintenance-badge maintenance-badge--${item.status.toLowerCase()}`}>{statusLabel(item.status)}</span></td><td className="maintenance-actions">{item.status==='AGENDADA'&&<><button onClick={()=>abrirConclusao(item)}>Concluir</button><button onClick={()=>abrirCancelamento(item)}>Cancelar</button></>}</td></tr>)}</tbody></table></div><footer className="maintenance-pagination"><span>Página {pagina+1} de {Math.max(manutencoesQuery.data?.totalPages??1,1)}</span><div><button disabled={!pagina} onClick={()=>setPagina(p=>p-1)}>Anterior</button><button disabled={pagina+1>=(manutencoesQuery.data?.totalPages??0)} onClick={()=>setPagina(p=>p+1)}>Próxima</button></div></footer></>}
    </section>
    {acao?.tipo==='agendar'&&<AgendarManutencaoDialog aoFechar={fechar}/>}
    {acao&&acao.tipo!=='agendar'&&<div className="maintenance-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)fechar()}}><section className="maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="maintenance-dialog-title"><header><h2 id="maintenance-dialog-title">{acao.tipo==='concluir'?'Concluir manutenção':'Cancelar manutenção'}</h2><button aria-label="Fechar" onClick={fechar}>×</button></header><form onSubmit={enviar}>
      {acao.tipo==='concluir'?<><p>O horímetro informado deve ser igual ou menor que a leitura atual do equipamento.</p><label>Equipamento<input readOnly value={`${acao.manutencao.codigoEquipamento} · ${acao.manutencao.nomeEquipamento}`}/></label><div className="maintenance-form-grid"><label>Data e hora<input type="datetime-local" required max={agoraLocal()} value={form.dataExecucao} onChange={e=>setForm({...form,dataExecucao:e.target.value})}/></label><label>Horímetro da execução<input type="number" required min={acao.manutencao.horimetroExecucao??0} max={equipment?.horimetroAtual??Number.MAX_SAFE_INTEGER} step="0.1" value={form.horimetroExecucao} onChange={e=>setForm({...form,horimetroExecucao:e.target.value})}/></label></div><label>Observações<textarea rows={3} maxLength={2000} value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})}/></label></>:<><p>Confirme o cancelamento de <strong>{acao.manutencao.codigoEquipamento} · {acao.manutencao.nomeEquipamento}</strong>. O histórico será preservado.</p><label>Motivo (opcional)<textarea rows={3} maxLength={500} value={form.observacoes} onChange={e=>setForm({...form,observacoes:e.target.value})}/></label></>}
      {salvar.isError&&<p className="maintenance-form-error" role="alert">{salvar.error.message}</p>}<footer><button type="button" onClick={fechar}>Voltar</button><button className="maintenance-primary" disabled={salvar.isPending} type="submit">{salvar.isPending?'Salvando…':acao.tipo==='concluir'?'Registrar conclusão':'Confirmar cancelamento'}</button></footer>
    </form></section></div>}
  </section>
}

function agoraLocal(){const agora=new Date();agora.setMinutes(agora.getMinutes()-agora.getTimezoneOffset());return agora.toISOString().slice(0,16)}
// Ordenações oferecidas na lista. O backend recebe `sort` direto no Pageable; `id` é adicionado como desempate
// para a paginação ficar estável quando várias manutenções têm a mesma data.
type Ordem='prazo-asc'|'prazo-desc'|'execucao-desc'|'cadastro-desc'
const ORDENS:Record<Ordem,{label:string;sort:string}>={
  'prazo-asc':{label:'Prazo mais próximo',sort:'dataAgendada,asc'},
  'prazo-desc':{label:'Prazo mais distante',sort:'dataAgendada,desc'},
  'execucao-desc':{label:'Execução mais recente',sort:'dataExecucao,desc'},
  'cadastro-desc':{label:'Cadastro mais recente',sort:'criadoEm,desc'},
}
// Agendadas e canceladas não têm data de execução; no PostgreSQL os nulos viriam primeiro nessa ordem.
function ordensDisponiveis(status:string):Ordem[]{return status==='CONCLUIDA'||status===''?['prazo-asc','prazo-desc','execucao-desc','cadastro-desc']:['prazo-asc','prazo-desc','cadastro-desc']}
function statusLabel(status:Status){return({AGENDADA:'Agendada',CONCLUIDA:'Concluída',CANCELADA:'Cancelada'})[status]}
function formatarDia(valor:string|null){return valor?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'}).format(new Date(`${valor}T12:00:00`)):'—'}
function formatarData(valor:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(valor))}
