import { Braces } from 'lucide-react'
import type { ToolMeta } from '@/catalog/types'

export const meta: ToolMeta = {
  id: 'json-to-csv',
  name: 'JSON to CSV',
  description:
    'Convert JSON (upload or paste) into CSV. Finds nested arrays and flattens child objects.',
  category: 'Data',
  keywords: ['convert', 'spreadsheet', 'excel', 'table', 'flatten', 'export'],
  icon: Braces,
  execution: 'client',
}
