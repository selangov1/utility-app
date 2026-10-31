import { describe, expect, it } from 'vitest'
import { Braces } from 'lucide-react'
import { searchTools } from './search'
import type { ToolMeta } from './types'

const tool = (id: string, name: string, extra: Partial<ToolMeta> = {}): ToolMeta => ({
  id,
  name,
  description: '',
  category: 'Data',
  keywords: [],
  icon: Braces,
  ...extra,
})

const tools = [
  tool('json-to-csv', 'JSON to CSV', { keywords: ['spreadsheet'] }),
  tool('url-encode-decode', 'URL Encode / Decode', { category: 'Encoding', keywords: ['percent'] }),
  tool('json-format', 'JSON Formatter', { description: 'Pretty print JSON' }),
]

const ids = (q: string) => searchTools(tools, q).map((t) => t.id)

describe('searchTools', () => {
  it('returns all tools in order for an empty query', () => {
    expect(ids('  ')).toEqual(['json-to-csv', 'url-encode-decode', 'json-format'])
  })

  it('matches names, keywords and categories case-insensitively', () => {
    expect(ids('URL')).toEqual(['url-encode-decode'])
    expect(ids('spread')).toEqual(['json-to-csv'])
    expect(ids('encoding')).toEqual(['url-encode-decode'])
  })

  it('requires every token to match', () => {
    expect(ids('json csv')).toEqual(['json-to-csv'])
    expect(ids('json nope')).toEqual([])
  })

  it('supports subsequence fuzzy matching', () => {
    expect(ids('jsfmt')).toEqual(['json-format'])
  })

  it('ranks name prefix matches above description matches', () => {
    expect(ids('pretty')).toEqual(['json-format'])
    expect(ids('json')[0]).toBe('json-to-csv')
  })
})
