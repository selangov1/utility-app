import { describe, expect, it } from 'vitest'
import { decodeUtf8, jsonToCsv } from './logic'

// Expected outputs were generated from the original Python implementation for parity.
const cases: [string, string | undefined, string, string][] = [
  [
    '[{"id":1,"name":"Ada","tags":["a","b"],"active":true,"x":null}]',
    undefined,
    'id,name,tags,active,x\r\n1,Ada,a; b,true,\r\n',
    '',
  ],
  [
    '{"meta":{"n":1},"data":{"items":[{"a":1},{"a":2,"b":{"c":"x,y"}}]},"other":[{"z":1}]}',
    undefined,
    'a,b.c\r\n1,\r\n2,"x,y"\r\n',
    'data.items',
  ],
  ['{"data":{"items":[{"a":1}]}}', 'data', 'items.0.a\r\n1\r\n', 'data'],
  ['{"a":{"b":{}},"c":[]}', undefined, 'a.b,c\r\n,\r\n', ''],
  ['[1,2,"q\\"uote"]', undefined, 'value\r\n1\r\n2\r\n"q""uote"\r\n', ''],
  ['[{"items":[{"n":"x"},{"n":"y\\nz"}]}]', undefined, 'items.0.n,items.1.n\r\nx,"y\nz"\r\n', ''],
  ['{"x":[{"a":1}]}', 'x.0', 'a\r\n1\r\n', 'x.0'],
  ['[{}]', undefined, '\r\n\r\n', ''],
  ['[{"a":""}]', undefined, 'a\r\n""\r\n', ''],
]

describe('jsonToCsv', () => {
  it.each(cases)('converts %s (path=%s)', (input, path, csv, source) => {
    const result = jsonToCsv(input, path)
    expect(result.csv).toBe(csv)
    expect(result.source).toBe(source)
  })

  it('treats a blank path as auto-detect', () => {
    expect(jsonToCsv('{"d":[{"a":1}]}', '   ').source).toBe('d')
  })

  it.each([
    ['{bad', undefined, /^Invalid JSON/],
    ['{"a":1}', 'zz', "Path 'zz' not found in JSON"],
    ['{"a":1}', 'a', "Path 'a' must point to an array or an object"],
    ['[]', undefined, 'No records found to convert'],
    ['"str"', undefined, 'JSON must be an object or an array'],
  ])('rejects %s', (input, path, message) => {
    expect(() => jsonToCsv(input, path)).toThrow(message)
  })

  it('does not resolve inherited properties in paths', () => {
    expect(() => jsonToCsv('{"a":1}', 'constructor')).toThrow('not found')
  })
})

describe('decodeUtf8', () => {
  it('strips a BOM', () => {
    expect(decodeUtf8(new Uint8Array([0xef, 0xbb, 0xbf, 0x5b, 0x5d]).buffer)).toBe('[]')
  })

  it('rejects invalid UTF-8', () => {
    expect(() => decodeUtf8(new Uint8Array([0xc3, 0x28]).buffer)).toThrow('UTF-8')
  })
})
