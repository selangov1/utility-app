import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

export const CATEGORIES = ['Data', 'Encoding', 'Text', 'Network'] as const
export type Category = (typeof CATEGORIES)[number]

export interface ToolMeta {
  id: string
  name: string
  description: string
  category: Category
  /** Extra search terms (aliases, synonyms). */
  keywords: readonly string[]
  icon: LucideIcon
}

export interface ToolDefinition extends ToolMeta {
  load: () => Promise<{ default: ComponentType }>
}
