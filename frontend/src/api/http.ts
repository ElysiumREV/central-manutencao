export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let authorizationHeader: string | null = null

function getAuthorizationHeader() {
  return authorizationHeader
}

export function definirCredenciais(usuario: string, senha: string) {
  const texto = `${usuario}:${senha}`
  const bytes = new TextEncoder().encode(texto)
  const binario = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  authorizationHeader = `Basic ${btoa(binario)}`
}

export function limparCredenciais() {
  authorizationHeader = null
}

export function possuiCredenciais() {
  return getAuthorizationHeader() !== null
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const authorization = getAuthorizationHeader()
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  })

  if (response.status === 204) return undefined as T

  // Aceita `application/json` e também `application/problem+json`, usado pelos erros ProblemDetail (RFC 7807).
  const contentType = response.headers.get('content-type') ?? ''
  const body = /[/+]json\b/.test(contentType)
    ? ((await response.json()) as { detail?: string; message?: string })
    : undefined

  if (!response.ok) {
    throw new ApiError(body?.detail ?? body?.message ?? 'Não foi possível concluir a operação.', response.status)
  }

  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string) => request<T>(path, { method: 'PATCH' }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}
