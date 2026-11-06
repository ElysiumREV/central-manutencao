import type { Plano, StatusPlano } from '../../api/tipos'

export interface MudancaStatus { plano: string; de: StatusPlano; para: StatusPlano; horasRestantes: number }

/**
 * Compara os planos do equipamento antes e depois de uma leitura e devolve os que mudaram de situação.
 * O status vem pronto do backend; aqui só se compara. Planos que não existiam antes são ignorados.
 */
export function calcularMudancas(
  antes: Pick<Plano, 'id' | 'status'>[],
  depois: Pick<Plano, 'id' | 'nome' | 'status' | 'horasRestantes'>[],
): MudancaStatus[] {
  const statusAnterior = new Map(antes.map(plano => [plano.id, plano.status]))
  return depois.flatMap(plano => {
    const de = statusAnterior.get(plano.id)
    return de && de !== plano.status
      ? [{ plano: plano.nome, de, para: plano.status, horasRestantes: plano.horasRestantes }]
      : []
  })
}
