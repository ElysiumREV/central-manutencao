import type { StatusPlano } from '../api/tipos'

/** Texto exibido para cada situação de plano (o backend envia o código). */
export const ROTULOS_STATUS_PLANO: Record<StatusPlano, string> = { VENCIDA: 'Vencida', PROXIMA: 'Próxima', EM_DIA: 'Em dia' }
