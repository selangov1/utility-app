import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { protocol } from 'electron'
import { CONTENT_SECURITY_POLICY } from './csp'
import { APP_HOST, APP_SCHEME, resolveAppFile } from './urls'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json; charset=utf-8',
}

// Must run before the app is ready. `standard` + `secure` give the renderer a real,
// secure origin (app://app) so absolute asset paths, history routing and CSP 'self' work.
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true },
    },
  ])
}

// Files are read directly (not via net.fetch(file://)) so the session's request
// lockdown can keep the file: scheme blocked.
export function serveRenderer(rootDir: string): void {
  protocol.handle(APP_SCHEME, async (request) => {
    const url = new URL(request.url)
    const file = url.host === APP_HOST ? resolveAppFile(rootDir, url.pathname) : null
    if (!file) return new Response('Forbidden', { status: 403 })

    const body = await readFile(file).catch(() => undefined)
    if (!body) return new Response('Not found', { status: 404 })

    return new Response(new Uint8Array(body), {
      headers: {
        'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        'Content-Security-Policy': CONTENT_SECURITY_POLICY,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    })
  })
}
