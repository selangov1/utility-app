import type { ToolDefinition } from './types'
import { meta as jwtDecoder } from '@/tools/jwt-decoder/meta'
import { meta as jsonToCsv } from '@/tools/json-to-csv/meta'
import { meta as jsonStringify } from '@/tools/json-stringify/meta'
import { meta as urlCodec } from '@/tools/url-encode-decode/meta'

// Single source of truth for every tool in the app. Register new tools here.
export const tools: readonly ToolDefinition[] = [
  { ...jwtDecoder, load: () => import('@/tools/jwt-decoder/Tool') },
  { ...jsonToCsv, load: () => import('@/tools/json-to-csv/Tool') },
  { ...jsonStringify, load: () => import('@/tools/json-stringify/Tool') },
  { ...urlCodec, load: () => import('@/tools/url-encode-decode/Tool') },
]

const byId = new Map(tools.map((t) => [t.id, t]))

export function getTool(id: string): ToolDefinition | undefined {
  return byId.get(id)
}
