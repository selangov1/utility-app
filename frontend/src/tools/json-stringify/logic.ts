export type Indent = '2' | '4' | 'tab' | 'min'

export class JsonStringifyError extends Error {}

const INDENT: Record<Indent, string | number | undefined> = {
  '2': 2,
  '4': 4,
  tab: '\t',
  min: undefined,
}

/** Turns a JSON.parse failure into a message with line/column when the engine reports a position. */
function describeParseError(text: string, err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const match = /position (\d+)/.exec(raw)
  if (!match) return `Invalid JSON: ${raw}`
  const pos = Number(match[1])
  const before = text.slice(0, pos).split('\n')
  const line = before.length
  const column = before[before.length - 1].length + 1
  return `Invalid JSON at line ${line}, column ${column}: ${raw}`
}

/**
 * Validates `text` as JSON, then re-serializes it with JSON.stringify.
 * With `asString`, the result is itself a JSON string literal (escaped), ready to embed in code or another JSON document.
 */
export function stringifyJson(text: string, indent: Indent = '2', asString = false): string {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (err) {
    throw new JsonStringifyError(describeParseError(text, err))
  }
  const out = JSON.stringify(value, null, INDENT[indent])
  return asString ? JSON.stringify(out) : out
}
