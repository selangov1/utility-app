import path from 'node:path'

export const APP_SCHEME = 'app'
export const APP_HOST = 'app'
export const APP_ENTRY_URL = `${APP_SCHEME}://${APP_HOST}/`

/**
 * Maps an app:// URL path to a file inside `rootDir`. Extension-less paths are client
 * routes and resolve to index.html. Returns null for anything escaping `rootDir`.
 */
export function resolveAppFile(rootDir: string, pathname: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  if (decoded.includes('\0')) return null

  const relative = decoded.replace(/^[/\\]+/, '')
  const target = path.resolve(rootDir, path.extname(relative) ? relative : 'index.html')
  const fromRoot = path.relative(rootDir, target)
  if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) return null
  return target
}

/**
 * Whether a request may leave the renderer: only the app:// origin and local data/blob
 * URLs. The dev server origin (and DevTools) is allowed only when `devServerUrl` is set.
 */
export function isAllowedRequestUrl(rawUrl: string, devServerUrl?: string): boolean {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }
  const dev = devServerUrl ? new URL(devServerUrl) : undefined

  switch (url.protocol) {
    case `${APP_SCHEME}:`:
      return url.host === APP_HOST
    case 'data:':
      return true
    case 'blob:':
      return (
        rawUrl.startsWith(`blob:${APP_SCHEME}://${APP_HOST}/`) ||
        (dev !== undefined && rawUrl.startsWith(`blob:${dev.origin}/`))
      )
    case 'devtools:':
      return dev !== undefined
    case 'http:':
    case 'https:':
      return dev !== undefined && url.origin === dev.origin
    case 'ws:':
    case 'wss:':
      return dev !== undefined && url.host === dev.host
    default:
      return false
  }
}
