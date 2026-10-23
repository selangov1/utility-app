import type { ComponentType } from 'react'
import JsonToCsv from './JsonToCsv'

// Maps backend tool ids (GET /api/tools) to their UI. Register new tools here.
export const toolComponents: Record<string, ComponentType> = {
  'json-to-csv': JsonToCsv,
}
