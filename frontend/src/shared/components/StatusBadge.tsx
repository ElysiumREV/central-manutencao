import type { StatusPlano } from '../../api/tipos'
import { ROTULOS_STATUS_PLANO } from '../rotulos'

export default function StatusBadge({ status }: { status: StatusPlano }) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{ROTULOS_STATUS_PLANO[status]}</span>
}
