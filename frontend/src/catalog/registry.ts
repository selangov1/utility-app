import type { ToolDefinition } from './types'
import { meta as jsonToCsv } from '@/tools/json-to-csv/meta'
import { meta as urlCodec } from '@/tools/url-encode-decode/meta'

// Single source of truth for every tool in the app. Register new tools here.
export const tools: readonly ToolDefinition[] = [
  { ...jsonToCsv, load: () => import('@/tools/json-to-csv/Tool') },
  { ...urlCodec, load: () => import('@/tools/url-encode-decode/Tool') },
]

const byId = new Map(tools.map((t) => [t.id, t]))

export function getTool(id: string): ToolDefinition | undefined {
  return byId.get(id)
}
