import { describe, expect, it } from 'vitest'
import { JsonStringifyError, stringifyJson } from './logic'

describe('stringifyJson', () => {
  it('pretty-prints with 2 spaces by default', () => {
    expect(stringifyJson('{"a":[1,2],"b":null}')).toBe(
      '{\n  "a": [\n    1,\n    2\n  ],\n  "b": null\n}',
    )
  })

  it('supports 4 spaces, tabs and minified output', () => {
    expect(stringifyJson('{"a":1}', '4')).toBe('{\n    "a": 1\n}')
    expect(stringifyJson('{"a":1}', 'tab')).toBe('{\n\t"a": 1\n}')
    expect(stringifyJson('{\n  "a": [1, 2]\n}', 'min')).toBe('{"a":[1,2]}')
  })

  it('accepts any JSON value, not just objects', () => {
    expect(stringifyJson('  "hi"  ', 'min')).toBe('"hi"')
    expect(stringifyJson('42', 'min')).toBe('42')
    expect(stringifyJson('null', 'min')).toBe('null')
  })

  it('escapes the result as a string literal on request', () => {
    expect(stringifyJson('{"a":"x\\ny"}', 'min', true)).toBe('"{\\"a\\":\\"x\\\\ny\\"}"')
  })

  it('round-trips the escaped form', () => {
    const escaped = stringifyJson('{"a":[1,{"b":"c"}]}', '2', true)
    expect(JSON.parse(JSON.parse(escaped))).toEqual({ a: [1, { b: 'c' }] })
  })

  it('rejects invalid JSON', () => {
    expect(() => stringifyJson('{"a":1,}')).toThrow(JsonStringifyError)
    expect(() => stringifyJson("{'a':1}")).toThrow('Invalid JSON')
    expect(() => stringifyJson('')).toThrow(JsonStringifyError)
  })

  it('reports line and column when available', () => {
    expect(() => stringifyJson('{\n  "a": 1,\n  oops\n}')).toThrow(/line 3, column 3/)
  })
})
