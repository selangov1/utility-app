export class JwtDecodeError extends Error {}

export interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

function decodeSegment(segment: string, label: string): Record<string, unknown> {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(segment)) {
    throw new JwtDecodeError(`JWT ${label} contains invalid base64url characters`)
  }

  const unpadded = segment.replace(/=+$/, '')
  const remainder = unpadded.length % 4
  if (remainder === 1) {
    throw new JwtDecodeError(`JWT ${label} is not valid base64url`)
  }

  const padding = (4 - remainder) % 4
  if (segment.length !== unpadded.length && segment.length - unpadded.length !== padding) {
    throw new JwtDecodeError(`JWT ${label} has invalid base64url padding`)
  }

  let text: string
  try {
    const base64 = unpadded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding)
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new JwtDecodeError(`JWT ${label} is not valid UTF-8 base64url`)
  }

  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new JwtDecodeError(`JWT ${label} is not valid JSON`)
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new JwtDecodeError(`JWT ${label} must be a JSON object`)
  }
  return value as Record<string, unknown>
}

export function decodeJwt(token: string): DecodedJwt {
  const segments = token.trim().split('.')
  if (segments.length !== 3 || !segments[0] || !segments[1]) {
    throw new JwtDecodeError('Enter a compact JWT with exactly three segments: header, payload, and signature')
  }

  return {
    header: decodeSegment(segments[0], 'header'),
    payload: decodeSegment(segments[1], 'payload'),
    signature: segments[2],
  }
}