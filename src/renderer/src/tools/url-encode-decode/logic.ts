export type Mode = 'encode' | 'decode'
export type Scope = 'component' | 'url'

export class CodecError extends Error {}

const percent = (c: string) => '%' + c.charCodeAt(0).toString(16).toUpperCase()

function encode(text: string, scope: Scope): string {
  try {
    if (scope === 'url') {
      // encodeURI already keeps URL structure chars; also keep [] for IPv6 hosts / query arrays.
      return encodeURI(text).replace(/%5B/g, '[').replace(/%5D/g, ']')
    }
    // Encode everything except RFC 3986 unreserved characters.
    return encodeURIComponent(text).replace(/[!'()*]/g, percent)
  } catch {
    throw new CodecError('Input contains invalid Unicode (unpaired surrogate)')
  }
}

const HEX_PAIR = /^[0-9a-fA-F]{2}$/

/**
 * Lenient on malformed escapes (`%zz` is left as-is), strict on the bytes that
 * valid escapes decode to (must form valid UTF-8).
 */
function decode(text: string, plusAsSpace: boolean): string {
  const input = plusAsSpace ? text.replace(/\+/g, ' ') : text
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
  let out = ''
  let bytes: number[] = []
  const flush = () => {
    if (!bytes.length) return
    try {
      out += decoder.decode(new Uint8Array(bytes))
    } catch {
      throw new CodecError('Input contains invalid UTF-8 percent-escapes')
    }
    bytes = []
  }
  for (let i = 0; i < input.length; i++) {
    const hex = input.slice(i + 1, i + 3)
    if (input[i] === '%' && HEX_PAIR.test(hex)) {
      bytes.push(parseInt(hex, 16))
      i += 2
    } else {
      flush()
      out += input[i]
    }
  }
  flush()
  return out
}

export function urlCodec(
  text: string,
  mode: Mode,
  scope: Scope = 'component',
  plusAsSpace = false,
): string {
  return mode === 'encode' ? encode(text, scope) : decode(text, plusAsSpace)
}
