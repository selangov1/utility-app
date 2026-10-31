import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

export const CATEGORIES = ['Data', 'Encoding', 'Text', 'Network'] as const
export type Category = (typeof CATEGORIES)[number]

/**
 * - `client`: runs entirely in the browser. MUST NOT send user input anywhere.
 * - `server`: needs backend processing. Only these tools may import `@/lib/api`,
 *   and only from their own `api.ts` file.
 */
export type Execution = 'client' | 'server'

export interface ToolMeta {
  /** URL slug; for server tools it must match the backend tool id. */
  id: string
  name: string
  description: string
  category: Category
  /** Extra search terms (aliases, synonyms). */
  keywords: readonly string[]
  icon: LucideIcon
  execution: Execution
}

export interface ToolDefinition extends ToolMeta {
  load: () => Promise<{ default: ComponentType }>
}
