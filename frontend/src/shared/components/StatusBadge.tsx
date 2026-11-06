export type NivelAlerta = 'VENCIDA' | 'PROXIMA' | 'EM_DIA'

const ROTULOS: Record<NivelAlerta, string> = { VENCIDA: 'Vencida', PROXIMA: 'Próxima', EM_DIA: 'Em dia' }

export default function StatusBadge({ status }: { status: NivelAlerta }) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{ROTULOS[status]}</span>
}
