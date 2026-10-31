/**
 * The ONLY module allowed to talk to the backend. Lint rules restrict imports of
 * this file to `src/tools/<id>/api.ts` (server tools) and the capability hook.
 * Client tools must never import it.
 */

const API_PREFIX = '/api/'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request(path: string, init: RequestInit): Promise<Response> {
  if (!path.startsWith(API_PREFIX)) throw new Error(`API path must start with ${API_PREFIX}`)
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    })
  } catch {
    throw new ApiError('Could not reach the server.', 0)
  }
  if (!res.ok) {
    const detail = await res
      .json()
      .then((d: { detail?: unknown }) => (typeof d.detail === 'string' ? d.detail : undefined))
      .catch(() => undefined)
    throw new ApiError(detail ?? `Request failed (${res.status})`, res.status)
  }
  return res
}

export async function getJson<T>(path: string): Promise<T> {
  return (await request(path, { method: 'GET' })).json() as Promise<T>
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

export async function postForm(path: string, body: FormData): Promise<Response> {
  return request(path, { method: 'POST', body })
}
