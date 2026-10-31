import { Link } from 'lucide-react'
import type { ToolMeta } from '@/catalog/types'

export const meta: ToolMeta = {
  id: 'url-encode-decode',
  name: 'URL Encode / Decode',
  description:
    'Percent-encode or decode text for use in URLs, as a full URL or a single component.',
  category: 'Encoding',
  keywords: ['percent', 'escape', 'unescape', 'uri', 'querystring', 'urlencode'],
  icon: Link,
  execution: 'client',
}
