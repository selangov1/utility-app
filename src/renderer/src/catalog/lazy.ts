import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ToolDefinition } from './types'

const cache = new Map<string, LazyExoticComponent<ComponentType>>()

/** Code-split tool UI: each tool's bundle is fetched only when first opened. */
export function getToolComponent(tool: ToolDefinition): LazyExoticComponent<ComponentType> {
  let component = cache.get(tool.id)
  if (!component) {
    component = lazy(tool.load)
    cache.set(tool.id, component)
  }
  return component
}
