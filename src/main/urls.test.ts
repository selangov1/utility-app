import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isAllowedRequestUrl, resolveAppFile } from './urls'

const root = path.resolve('/srv/renderer')
const inRoot = (...parts: string[]) => path.join(root, ...parts)

describe('resolveAppFile', () => {
  it('serves index.html for the root and extension-less client routes', () => {
    expect(resolveAppFile(root, '/')).toBe(inRoot('index.html'))
    expect(resolveAppFile(root, '/tools/json-to-csv')).toBe(inRoot('index.html'))
  })

  it('maps asset paths to files under the root', () => {
    expect(resolveAppFile(root, '/assets/index-abc.js')).toBe(inRoot('assets', 'index-abc.js'))
    expect(resolveAppFile(root, '/favicon.svg')).toBe(inRoot('favicon.svg'))
  })

  it('rejects path traversal, including encoded forms', () => {
    expect(resolveAppFile(root, '/../secret.txt')).toBeNull()
    expect(resolveAppFile(root, '/%2e%2e/secret.txt')).toBeNull()
    expect(resolveAppFile(root, '/..%5Csecret.txt')).toBeNull()
    expect(resolveAppFile(root, '/assets/../../secret.txt')).toBeNull()
  })

  it('rejects absolute and malformed paths', () => {
    expect(resolveAppFile(root, '/C:/Windows/win.ini')).toBeNull()
    expect(resolveAppFile(root, '/%E0%A4%A')).toBeNull()
    expect(resolveAppFile(root, '/a%00.js')).toBeNull()
  })
})

describe('isAllowedRequestUrl', () => {
  it('allows only the app origin and local data/blob URLs in production', () => {
    expect(isAllowedRequestUrl('app://app/index.html')).toBe(true)
    expect(isAllowedRequestUrl('data:image/png;base64,AAAA')).toBe(true)
    expect(isAllowedRequestUrl('blob:app://app/6f1c')).toBe(true)
  })

  it('blocks everything else in production', () => {
    for (const url of [
      'https://example.com/',
      'http://localhost:5173/',
      'ws://localhost:5173/',
      'file:///C:/Windows/win.ini',
      'app://evil/index.html',
      'blob:https://example.com/6f1c',
      'devtools://devtools/bundled/inspector.html',
      'not a url',
    ]) {
      expect(isAllowedRequestUrl(url), url).toBe(false)
    }
  })

  it('additionally allows only the dev server when one is configured', () => {
    const dev = 'http://localhost:5173/'
    expect(isAllowedRequestUrl('http://localhost:5173/src/main.tsx', dev)).toBe(true)
    expect(isAllowedRequestUrl('ws://localhost:5173/', dev)).toBe(true)
    expect(isAllowedRequestUrl('devtools://devtools/bundled/inspector.html', dev)).toBe(true)
    expect(isAllowedRequestUrl('http://localhost:9999/', dev)).toBe(false)
    expect(isAllowedRequestUrl('https://example.com/', dev)).toBe(false)
  })
})
