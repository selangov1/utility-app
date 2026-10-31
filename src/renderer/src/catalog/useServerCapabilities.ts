import { useEffect, useState } from 'react'
import { getJson } from '@/lib/api'

export type CapabilityState =
  | { status: 'loading' }
  | { status: 'ready'; ids: ReadonlySet<string> }
  | { status: 'unavailable' }

let cached: Promise<ReadonlySet<string>> | undefined

function load(): Promise<ReadonlySet<string>> {
  cached ??= getJson<{ id: string }[]>('/api/tools')
    .then((list) => new Set(list.map((t) => t.id)))
    .catch((err: unknown) => {
      cached = undefined
      throw err
    })
  return cached
}

/**
 * Which server-side tools the backend currently provides. Only called when a
 * server tool is present in the catalog, so client-only usage never contacts the backend.
 */
export function useServerCapabilities(enabled: boolean): CapabilityState {
  const [state, setState] = useState<CapabilityState>({ status: 'loading' })

  useEffect(() => {
    if (!enabled) return
    let active = true
    load().then(
      (ids) => active && setState({ status: 'ready', ids }),
      () => active && setState({ status: 'unavailable' }),
    )
    return () => {
      active = false
    }
  }, [enabled])

  return enabled ? state : { status: 'ready', ids: new Set() }
}
