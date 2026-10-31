import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ThemeSelector } from '@/components/ThemeSelector'
import { getTool, tools } from '@/catalog/registry'
import { searchTools } from '@/catalog/search'
import { useFavorites, useRecents } from '@/catalog/preferences'
import { CATEGORIES, type ToolDefinition } from '@/catalog/types'
import { useHotkey } from '@/lib/useHotkey'
import { cn } from '@/lib/utils'
import { FavoriteButton } from './FavoriteButton'

function resolve(ids: readonly string[]): ToolDefinition[] {
  return ids.map(getTool).filter((t): t is ToolDefinition => t !== undefined)
}

function ToolLink({ tool, active }: { tool: ToolDefinition; active: boolean }) {
  const Icon = tool.icon
  return (
    <li className="group/item relative">
      <Link
        to="/tools/$toolId"
        params={{ toolId: tool.id }}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex h-8 items-center gap-2 rounded-lg pr-9 pl-2.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
          active && 'bg-secondary font-medium text-secondary-foreground',
        )}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{tool.name}</span>
      </Link>
      <FavoriteButton
        toolId={tool.id}
        toolName={tool.name}
        size="icon-xs"
        className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100"
      />
    </li>
  )
}

function Section({ title, items, activeId }: { title: string; items: ToolDefinition[]; activeId?: string }) {
  if (items.length === 0) return null
  return (
    <section aria-label={title} className="flex flex-col gap-1">
      <h2 className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="flex flex-col gap-0.5">
        {items.map((t) => (
          <ToolLink key={t.id} tool={t} active={t.id === activeId} />
        ))}
      </ul>
    </section>
  )
}

export function Sidebar() {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { ids: favoriteIds } = useFavorites()
  const recentIds = useRecents()
  const activeId = useParams({ strict: false }).toolId

  useHotkey('/', () => inputRef.current?.focus(), { ignoreInInputs: true })

  const results = useMemo(() => searchTools(tools, query), [query])
  const searching = query.trim() !== ''

  return (
    <nav
      aria-label="Tools"
      className="flex w-full shrink-0 flex-col gap-4 border-b p-4 md:sticky md:top-0 md:h-svh md:w-64 md:border-r md:border-b-0"
    >
      <Link to="/" className="text-xl font-semibold tracking-tight">
        Utility App
      </Link>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          autoComplete="off"
          aria-label="Search tools"
          placeholder="Search tools…  ( / )"
          className="pl-8"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('')
          }}
        />
      </div>
      <Separator />
      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
        {searching ? (
          results.length ? (
            <Section title="Results" items={results} activeId={activeId} />
          ) : (
            <p className="px-2.5 text-sm text-muted-foreground">No tools match “{query}”.</p>
          )
        ) : (
          <>
            <Section title="Favorites" items={resolve(favoriteIds)} activeId={activeId} />
            <Section title="Recent" items={resolve(recentIds)} activeId={activeId} />
            {CATEGORIES.map((c) => (
              <Section
                key={c}
                title={c}
                items={tools.filter((t) => t.category === c)}
                activeId={activeId}
              />
            ))}
          </>
        )}
      </div>
      <ThemeSelector />
    </nav>
  )
}
