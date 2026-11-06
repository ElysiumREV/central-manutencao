import { describe, expect, it } from 'vitest'
import { formatDate, formatHours } from './formatters'

describe('formatHours', () => {
  it('usa vírgula decimal e uma casa', () => {
    expect(formatHours(1234.56)).toBe('1.234,6 h')
  })

  it('usa o sinal de menos tipográfico para atraso', () => {
    expect(formatHours(-250)).toBe('−250 h')
  })
})

describe('formatDate', () => {
  it('formata data de calendário sem deslocar o dia pelo fuso', () => {
    expect(formatDate('2026-11-08')).toBe('08/11/2026')
  })

  it('indica quando não há data', () => {
    expect(formatDate(null)).toBe('Data não definida')
  })
})
