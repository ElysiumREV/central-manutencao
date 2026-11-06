import { describe, expect, it } from 'vitest'
import { calcularMudancas } from './impactoLeitura'

const plano = (id: number, status: 'VENCIDA' | 'PROXIMA' | 'EM_DIA', horasRestantes = 0) => ({
  id,
  nome: `Plano ${id}`,
  status,
  horasRestantes,
})

describe('calcularMudancas', () => {
  it('lista só os planos que mudaram de situação', () => {
    const antes = [plano(1, 'PROXIMA'), plano(2, 'EM_DIA')]
    const depois = [plano(1, 'VENCIDA', -20), plano(2, 'EM_DIA', 300)]

    expect(calcularMudancas(antes, depois)).toEqual([
      { plano: 'Plano 1', de: 'PROXIMA', para: 'VENCIDA', horasRestantes: -20 },
    ])
  })

  it('devolve lista vazia quando nada mudou', () => {
    expect(calcularMudancas([plano(1, 'EM_DIA')], [plano(1, 'EM_DIA', 100)])).toEqual([])
  })

  it('ignora planos que não existiam antes da leitura', () => {
    expect(calcularMudancas([], [plano(3, 'VENCIDA', -5)])).toEqual([])
  })
})
