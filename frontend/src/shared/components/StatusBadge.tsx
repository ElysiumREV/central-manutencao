import type { StatusPlano } from '../../api/tipos'

const ROTULOS: Record<StatusPlano, string> = { VENCIDA: 'Vencida', PROXIMA: 'Próxima', EM_DIA: 'Em dia' }

export default function StatusBadge({ status }: { status: StatusPlano }) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{ROTULOS[status]}</span>
}
