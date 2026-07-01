const DEFAULT_API_URL = 'https://auralith-backend-production.up.railway.app'

function normalizeApiUrl(url: string) {
  const normalizedUrl = url.replace(/\/+$/, '')

  return normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`
}

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL ?? DEFAULT_API_URL)

export const ADMIN_TOKEN_KEY = 'auralith-admin-token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getAdminToken() {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string | null) {
  if (token) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY)
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (authenticated) {
    const token = getAdminToken()

    if (!token) {
      throw new ApiError('La sesion administrativa no esta disponible.', 401)
    }

    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[]
    } | null
    const message = Array.isArray(payload?.message)
      ? payload.message.join(' ')
      : payload?.message

    throw new ApiError(message ?? 'No se pudo completar la solicitud.', response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function downloadAdminFile(path: string, filename: string) {
  const token = getAdminToken()

  if (!token) {
    throw new ApiError('La sesion administrativa no esta disponible.', 401)
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new ApiError('No se pudo generar el archivo.', response.status)
  }

  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
