import { useSyncExternalStore } from 'react'

// Only tool ids are ever persisted — never tool input or output.
export const FAVORITES_KEY = 'utility-app:favorites'
export const RECENTS_KEY = 'utility-app:recents'
export const MAX_RECENTS = 5

type Listener = () => void

export interface IdListStore {
  get(): readonly string[]
  set(ids: readonly string[]): void
  subscribe(listener: Listener): () => void
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

const ID_PATTERN = /^[a-z0-9-]{1,64}$/

export function createIdListStore(key: string, storage = safeStorage()): IdListStore {
  const listeners = new Set<Listener>()
  let cache: readonly string[] | undefined

  function read(): readonly string[] {
    try {
      const parsed: unknown = JSON.parse(storage?.getItem(key) ?? '[]')
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string' && ID_PATTERN.test(v))
      }
    } catch {
      // corrupt or unavailable storage
    }
    return []
  }

  return {
    get() {
      cache ??= read()
      return cache
    },
    set(ids) {
      cache = ids.filter((id) => ID_PATTERN.test(id))
      try {
        storage?.setItem(key, JSON.stringify(cache))
      } catch {
        // ignore persistence failures
      }
      listeners.forEach((l) => l())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

export function pushRecent(ids: readonly string[], id: string, max = MAX_RECENTS): string[] {
  return [id, ...ids.filter((x) => x !== id)].slice(0, max)
}

export const favoritesStore = createIdListStore(FAVORITES_KEY)
export const recentsStore = createIdListStore(RECENTS_KEY)

function useIdList(store: IdListStore) {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

export function useFavorites() {
  const ids = useIdList(favoritesStore)
  return {
    ids,
    isFavorite: (id: string) => ids.includes(id),
    toggle: (id: string) => favoritesStore.set(toggleId(favoritesStore.get(), id)),
  }
}

export function useRecents() {
  return useIdList(recentsStore)
}

export function recordRecent(id: string) {
  recentsStore.set(pushRecent(recentsStore.get(), id))
}
