import { Braces } from 'lucide-react'
import type { ToolMeta } from '@/catalog/types'

export const meta: ToolMeta = {
  id: 'json-stringify',
  name: 'JSON Stringify',
  description:
    'Validate pasted JSON and run it through JSON.stringify: pretty-print, minify, or escape as a string literal.',
  category: 'Data',
  keywords: ['json', 'format', 'pretty', 'minify', 'escape', 'validate', 'beautify', 'serialize'],
  icon: Braces,
  execution: 'client',
}
