import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['VENCIDA', 'Vencida', 'status-badge--vencida'],
    ['PROXIMA', 'Próxima', 'status-badge--proxima'],
    ['EM_DIA', 'Em dia', 'status-badge--em_dia'],
  ] as const)('mostra %s como "%s"', (status, rotulo, classe) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(rotulo)).toHaveClass(classe)
  })
})
