import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CornerDownLeft, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { getTool, tools } from '@/catalog/registry'
import { searchTools } from '@/catalog/search'
import { useFavorites, useRecents } from '@/catalog/preferences'
import type { ToolDefinition } from '@/catalog/types'
import { useHotkey } from '@/lib/useHotkey'
import { cn } from '@/lib/utils'

function useDefaultOrder(): ToolDefinition[] {
  const { ids: favorites } = useFavorites()
  const recents = useRecents()
  return useMemo(() => {
    const first = [...recents, ...favorites]
      .map(getTool)
      .filter((t): t is ToolDefinition => t !== undefined)
    return [...new Set([...first, ...tools])]
  }, [favorites, recents])
}

function Palette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const defaults = useDefaultOrder()
  const results = useMemo(
    () => (query.trim() ? searchTools(tools, query) : defaults),
    [query, defaults],
  )
  const index = Math.min(selected, Math.max(results.length - 1, 0))

  function open(tool: ToolDefinition | undefined) {
    if (!tool) return
    onClose()
    void navigate({ to: '/tools/$toolId', params: { toolId: tool.id } })
  }

  return (
    <>
      <DialogTitle className="sr-only">Search tools</DialogTitle>
      <div className="flex items-center gap-2 border-b px-3">
        <Search aria-hidden="true" className="size-4 text-muted-foreground" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={results[index] ? `palette-${results[index].id}` : undefined}
          aria-label="Search tools"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search tools…"
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSelected((index + 1) % Math.max(results.length, 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSelected((index - 1 + results.length) % Math.max(results.length, 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              open(results[index])
            }
          }}
        />
      </div>
      <ul id="palette-results" role="listbox" aria-label="Tools" className="max-h-80 overflow-y-auto p-1.5">
        {results.length === 0 && (
          <li className="px-2.5 py-6 text-center text-sm text-muted-foreground">No tools found.</li>
        )}
        {results.map((t, i) => {
          const Icon = t.icon
          return (
            <li
              key={t.id}
              id={`palette-${t.id}`}
              role="option"
              aria-selected={i === index}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2',
                i === index && 'bg-muted',
              )}
              onMouseMove={() => setSelected(i)}
              onClick={() => open(t)}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.name}</div>
                <div className="truncate text-xs text-muted-foreground">{t.description}</div>
              </div>
              <span className="text-xs text-muted-foreground">{t.category}</span>
              {i === index && <CornerDownLeft aria-hidden="true" className="size-3.5 text-muted-foreground" />}
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  useHotkey('k', () => setOpen((o) => !o), { mod: true })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {open && <Palette onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}
