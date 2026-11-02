import { describe, expect, it } from 'vitest'
import { decodeJwt, JwtDecodeError } from './logic'

describe('decodeJwt', () => {
  it('decodes base64url header and payload, including UTF-8 claims', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiLDqSJ9.c2ln'
    expect(decodeJwt(token)).toEqual({
      header: { alg: 'HS256' },
      payload: { sub: 'é' },
      signature: 'c2ln',
    })
  })

  it('accepts surrounding whitespace and optional base64 padding', () => {
    expect(decodeJwt('  eyJhbGciOiJub25lIn0=.e30=.  ')).toEqual({
      header: { alg: 'none' },
      payload: {},
      signature: '',
    })
  })

  it('rejects anything other than three compact segments', () => {
    expect(() => decodeJwt('')).toThrow(JwtDecodeError)
    expect(() => decodeJwt('a.b')).toThrow(/three segments/)
    expect(() => decodeJwt('a.b.c.d')).toThrow(/three segments/)
  })

  it('rejects invalid base64url and malformed JSON', () => {
    expect(() => decodeJwt('@@.e30.sig')).toThrow(/base64url/)
    expect(() => decodeJwt('eA.e30.sig')).toThrow(/valid JSON/)
  })

  it('requires header and payload to be JSON objects', () => {
    expect(() => decodeJwt('bnVsbA.e30.sig')).toThrow(/JSON object/)
    expect(() => decodeJwt('e30.WzFd.sig')).toThrow(/JSON object/)
  })
})