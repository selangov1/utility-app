import { KeyRound } from 'lucide-react'
import type { ToolMeta } from '@/catalog/types'

export const meta: ToolMeta = {
  id: 'jwt-decoder',
  name: 'JWT Decoder',
  description: 'Decode a compact JWT header and payload locally without verifying its signature.',
  category: 'Encoding',
  keywords: ['jwt', 'token', 'json web token', 'claims', 'base64url', 'decode', 'bearer'],
  icon: KeyRound,
}