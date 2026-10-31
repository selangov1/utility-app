import { describe, expect, it } from 'vitest'
import { tools } from './registry'
import { CATEGORIES } from './types'

// Static source scan: enforces the client/server data-exposure boundary.
const sources = import.meta.glob<string>('/src/tools/*/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const toolDirs = new Set(Object.keys(sources).map((p) => p.split('/')[3]))
const NETWORK_PATTERN =
  /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|@\/lib\/api|from\s+['"][./]*api['"]/

describe('tool catalog', () => {
  it('has unique, url-safe ids matching their folder', () => {
    const ids = tools.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/)
      expect(toolDirs.has(id)).toBe(true)
    }
  })

  it('registers every tool folder', () => {
    expect([...toolDirs].sort()).toEqual(tools.map((t) => t.id).sort())
  })

  it('uses known categories', () => {
    for (const t of tools) expect(CATEGORIES).toContain(t.category)
  })

  it('client tools contain no network access', () => {
    for (const t of tools.filter((x) => x.execution === 'client')) {
      for (const [path, src] of Object.entries(sources)) {
        if (path.startsWith(`/src/tools/${t.id}/`) && !path.endsWith('.test.ts')) {
          expect(src, `${path} must not perform network requests`).not.toMatch(NETWORK_PATTERN)
        }
      }
    }
  })

  it('server tools only reach the backend through their api.ts', () => {
    for (const t of tools.filter((x) => x.execution === 'server')) {
      for (const [path, src] of Object.entries(sources)) {
        if (!path.startsWith(`/src/tools/${t.id}/`) || path.endsWith('/api.ts')) continue
        if (path.endsWith('.test.ts')) continue
        expect(src, `${path} must use ./api`).not.toMatch(/\bfetch\s*\(|@\/lib\/api/)
      }
    }
  })
})
