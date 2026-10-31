import { describe, expect, it, vi } from 'vitest'
import { createIdListStore, pushRecent, toggleId } from './preferences'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size
    },
  }
}

describe('createIdListStore', () => {
  it('ignores corrupt or unexpected stored values', () => {
    expect(createIdListStore('k', memoryStorage({ k: '{oops' })).get()).toEqual([])
    expect(createIdListStore('k', memoryStorage({ k: '{"a":1}' })).get()).toEqual([])
    expect(
      createIdListStore('k', memoryStorage({ k: '["ok-id", 5, "<script>", "x"]' })).get(),
    ).toEqual(['ok-id', 'x'])
  })

  it('persists ids and notifies subscribers', () => {
    const storage = memoryStorage()
    const store = createIdListStore('k', storage)
    const listener = vi.fn()
    store.subscribe(listener)
    store.set(['a', 'b'])
    expect(listener).toHaveBeenCalledOnce()
    expect(storage.getItem('k')).toBe('["a","b"]')
    expect(store.get()).toEqual(['a', 'b'])
  })

  it('works without storage', () => {
    const store = createIdListStore('k', undefined)
    store.set(['a'])
    expect(store.get()).toEqual(['a'])
  })
})

describe('list helpers', () => {
  it('toggles ids', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('keeps recents unique, most recent first, capped', () => {
    expect(pushRecent(['a', 'b', 'c'], 'b', 3)).toEqual(['b', 'a', 'c'])
    expect(pushRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b'])
  })
})
