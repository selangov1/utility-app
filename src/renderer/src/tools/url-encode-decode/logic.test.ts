import { describe, expect, it } from 'vitest'
import { urlCodec } from './logic'

describe('urlCodec encode', () => {
  it('encodes a component like Python quote(safe="")', () => {
    expect(urlCodec("a b&c/d?e=f!*'()~", 'encode')).toBe(
      'a%20b%26c%2Fd%3Fe%3Df%21%2A%27%28%29~',
    )
    expect(urlCodec('é€', 'encode')).toBe('%C3%A9%E2%82%AC')
  })

  it('keeps URL structure in full-URL mode', () => {
    expect(urlCodec('https://x.com/a b?q=[1]&r=é#h', 'encode', 'url')).toBe(
      'https://x.com/a%20b?q=[1]&r=%C3%A9#h',
    )
  })

  it('rejects unpaired surrogates', () => {
    expect(() => urlCodec('\ud800', 'encode')).toThrow('invalid Unicode')
  })
})

describe('urlCodec decode', () => {
  it('leaves malformed escapes and "+" intact', () => {
    expect(urlCodec('a%20b+c%zz%E2%82%AC', 'decode')).toBe('a b+c%zz€')
  })

  it('optionally treats "+" as space', () => {
    expect(urlCodec('a+b%20c', 'decode', 'component', true)).toBe('a b c')
    expect(urlCodec('a%2Bb', 'decode', 'component', true)).toBe('a+b')
  })

  it('rejects invalid UTF-8 byte sequences', () => {
    expect(() => urlCodec('%C3%28', 'decode')).toThrow('invalid UTF-8')
  })

  it('round-trips', () => {
    const s = 'héllo wörld/?&=#💡'
    expect(urlCodec(urlCodec(s, 'encode'), 'decode')).toBe(s)
  })
})
