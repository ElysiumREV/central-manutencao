/**
 * Tipos da API com nomes do domínio. A fonte é `schema.d.ts`, gerado do OpenAPI do backend com
 * `npm run gen:api` (com a API rodando). Não edite o arquivo gerado: mude o backend e gere de novo.
 */
import type { components } from './schema'

type Schemas = components['schemas']

export type Equipamento = Schemas['EquipamentoResponse']
export type Plano = Schemas['PlanoResponse']
export type Leitura = Schemas['LeituraResponse']
export type Manutencao = Schemas['ManutencaoResponse']
export type Alerta = Schemas['AlertaResponse']
export type DashboardResumo = Schemas['DashboardResumoResponse']

export type StatusPlano = Plano['status']
export type TipoManutencao = Manutencao['tipo']
export type StatusManutencao = Manutencao['status']
export type StatusEquipamento = Equipamento['status']

/** Página do Spring Data; só os campos que o frontend usa. */
export interface Pagina<T> { content: T[]; totalElements: number; totalPages: number; number: number }
