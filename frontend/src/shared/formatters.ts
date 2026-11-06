/** Formatadores de exibição compartilhados entre as telas (pt-BR). */

/** Horas do horímetro com uma casa decimal; negativos usam o sinal de menos tipográfico. */
export function formatHours(value: number) {
  const formatted = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Math.abs(value))
  return `${value < 0 ? '−' : ''}${formatted} h`
}

/** Data de calendário vinda da API como `AAAA-MM-DD`, sem conversão de fuso. */
export function formatDate(value: string | null) {
  if (!value) return 'Data não definida'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(year, month - 1, day))
}

/** Data e hora curtas a partir de um instante ISO, no fuso do navegador. */
export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

/** Data curta a partir de um instante ISO (converte para o fuso do navegador). */
export function formatCalendarDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value))
}
