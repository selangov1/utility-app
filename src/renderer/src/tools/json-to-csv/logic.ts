/**
 * Convert JSON into CSV, entirely in the browser.
 *
 * Supported shapes:
 * - a list of objects (each object is a row);
 * - an object containing an array of objects at any depth (e.g. `{"data": {"items": [...]}}`).
 *   The longest, then shallowest, such array is used unless an explicit path is given;
 * - a single object (one row);
 * - a list of scalars (one `value` column).
 *
 * Inside a row, nested objects are flattened into dotted columns (`address.city`);
 * arrays of scalars are joined with "; "; arrays of objects become indexed groups
 * (`items.0.name`).
 */

export const PATH_SEP = '.'

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type JsonObject = { [key: string]: Json }
type Flat = Map<string, string>

export class ConversionError extends Error {}

const isObject = (v: unknown): v is JsonObject =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function scalar(value: Json): string {
  if (value === null) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

const join = (prefix: string, key: string | number) =>
  prefix ? `${prefix}${PATH_SEP}${key}` : String(key)

export function flattenRecord(value: Json, prefix = '', out: Flat = new Map()): Flat {
  if (isObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0 && prefix) out.set(prefix, '')
    for (const [key, child] of entries) flattenRecord(child, join(prefix, key), out)
  } else if (Array.isArray(value)) {
    if (value.some((v) => typeof v === 'object' && v !== null)) {
      value.forEach((child, i) => flattenRecord(child, join(prefix, i), out))
    } else {
      out.set(prefix || 'value', value.map(scalar).join('; '))
    }
  } else {
    out.set(prefix || 'value', scalar(value))
  }
  return out
}

/** BFS over objects for arrays containing objects; longest first, then shallowest. */
export function findRecordArrays(data: Json): [string, Json[]][] {
  const found: { depth: number; path: string; arr: Json[] }[] = []
  const queue: [string, Json, number][] = [['', data, 0]]
  while (queue.length) {
    const [path, node, depth] = queue.shift()!
    if (!isObject(node)) continue
    for (const [key, child] of Object.entries(node)) {
      const childPath = join(path, key)
      if (Array.isArray(child) && child.some(isObject)) {
        found.push({ depth, path: childPath, arr: child })
      } else if (isObject(child)) {
        queue.push([childPath, child, depth + 1])
      }
    }
  }
  found.sort((a, b) => b.arr.length - a.arr.length || a.depth - b.depth)
  return found.map((f) => [f.path, f.arr])
}

export function resolvePath(data: Json, path: string): Json {
  let node = data
  for (const part of path.split(PATH_SEP)) {
    if (isObject(node) && Object.hasOwn(node, part)) {
      node = node[part]
    } else if (Array.isArray(node) && /^\d+$/.test(part) && Number(part) < node.length) {
      node = node[Number(part)]
    } else {
      throw new ConversionError(`Path '${path}' not found in JSON`)
    }
  }
  return node
}

/** Returns [records, sourcePath]; sourcePath is "" for the document root. */
export function extractRecords(data: Json, path?: string): [Json[], string] {
  if (path) {
    const node = resolvePath(data, path)
    if (Array.isArray(node)) return [node, path]
    if (isObject(node)) return [[node], path]
    throw new ConversionError(`Path '${path}' must point to an array or an object`)
  }
  if (Array.isArray(data)) return [data, '']
  if (isObject(data)) {
    const arrays = findRecordArrays(data)
    if (arrays.length) return [arrays[0][1], arrays[0][0]]
    return [[data], '']
  }
  throw new ConversionError('JSON must be an object or an array')
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

function csvRow(values: string[]): string {
  // Match Python's csv module: a lone empty field is quoted so the row isn't blank.
  if (values.length === 1 && values[0] === '') return '""\r\n'
  return values.map(csvField).join(',') + '\r\n'
}

export interface CsvResult {
  csv: string
  source: string
  rows: number
  columns: number
}

export function jsonToCsv(text: string, path?: string): CsvResult {
  let data: Json
  try {
    data = JSON.parse(text) as Json
  } catch (err) {
    throw new ConversionError(`Invalid JSON: ${(err as Error).message}`)
  }

  const [records, source] = extractRecords(data, path?.trim() || undefined)
  const rows = records.map((r) => flattenRecord(r))
  if (rows.length === 0) throw new ConversionError('No records found to convert')

  // Column order follows first appearance across all records.
  const fieldnames = [...new Set(rows.flatMap((row) => [...row.keys()]))]

  let csv = csvRow(fieldnames)
  for (const row of rows) csv += csvRow(fieldnames.map((f) => row.get(f) ?? ''))
  return { csv, source, rows: rows.length, columns: fieldnames.length }
}

/** Decode file bytes as strict UTF-8 (a leading BOM is stripped). */
export function decodeUtf8(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new ConversionError('File must be UTF-8 encoded')
  }
}
