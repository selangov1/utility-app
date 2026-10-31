import { Link } from '@tanstack/react-router'
import { getTool, tools } from '@/catalog/registry'
import { useFavorites } from '@/catalog/preferences'
import { CATEGORIES, type ToolDefinition } from '@/catalog/types'
import { FavoriteButton } from '@/components/shell/FavoriteButton'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon
  return (
    <li className="relative">
      <Link
        to="/tools/$toolId"
        params={{ toolId: tool.id }}
        className="flex h-full flex-col gap-2 rounded-xl p-4 pr-10 ring-1 ring-foreground/10 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="flex items-center gap-2 font-medium">
          <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
          {tool.name}
        </div>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </Link>
      <FavoriteButton toolId={tool.id} toolName={tool.name} className="absolute top-2 right-2" />
    </li>
  )
}

function Group({ title, items }: { title: string; items: ToolDefinition[] }) {
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </ul>
    </section>
  )
}

export function HomePage() {
  const { ids } = useFavorites()
  const favorites = ids.map(getTool).filter((t): t is ToolDefinition => t !== undefined)

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">All tools</h1>
        <p className="text-sm text-muted-foreground">
          Press{' '}
          <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">
            {isMac ? '⌘' : 'Ctrl'} K
          </kbd>{' '}
          to jump to any tool. Everything runs locally on this device; your data is never sent anywhere.
        </p>
      </div>
      <Group title="Favorites" items={favorites} />
      {CATEGORIES.map((c) => (
        <Group key={c} title={c} items={tools.filter((t) => t.category === c)} />
      ))}
    </div>
  )
}
