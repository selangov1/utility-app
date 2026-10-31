import { Suspense, useEffect, type ReactNode } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExecutionBadge } from '@/components/shell/ExecutionBadge'
import { FavoriteButton } from '@/components/shell/FavoriteButton'
import { getToolComponent } from '@/catalog/lazy'
import { recordRecent } from '@/catalog/preferences'
import { getTool } from '@/catalog/registry'
import type { ToolDefinition } from '@/catalog/types'
import { useServerCapabilities } from '@/catalog/useServerCapabilities'

/** Client tools render immediately; server tools only once the backend confirms support. */
function ServerGate({ tool, children }: { tool: ToolDefinition; children: ReactNode }) {
  const isServer = tool.execution === 'server'
  const caps = useServerCapabilities(isServer)
  if (!isServer) return children
  if (caps.status === 'loading') return <p className="text-sm text-muted-foreground">Checking server…</p>
  if (caps.status === 'unavailable' || !caps.ids.has(tool.id)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Server unavailable</AlertTitle>
        <AlertDescription>
          This tool needs the app server, which is not reachable or does not provide it.
        </AlertDescription>
      </Alert>
    )
  }
  return children
}

export function ToolPage() {
  const { toolId } = useParams({ from: '/tools/$toolId' })
  const tool = getTool(toolId)

  useEffect(() => {
    if (!tool) return
    recordRecent(tool.id)
    document.title = `${tool.name} · Utility App`
    return () => {
      document.title = 'Utility App'
    }
  }, [tool])

  if (!tool) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold">Tool not found</h1>
        <p className="text-sm text-muted-foreground">
          No tool with id <code>{toolId}</code>.{' '}
          <Link to="/" className="underline underline-offset-4">
            Browse all tools
          </Link>
        </p>
      </div>
    )
  }

  const Icon = tool.icon
  const ToolComponent = getToolComponent(tool)

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>
                <h1>{tool.name}</h1>
              </CardTitle>
              <ExecutionBadge execution={tool.execution} />
            </div>
            <CardDescription>{tool.description}</CardDescription>
          </div>
          <FavoriteButton toolId={tool.id} toolName={tool.name} />
        </div>
      </CardHeader>
      <CardContent>
        <ServerGate tool={tool}>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            {/* oxlint-disable-next-line react/static-components -- getToolComponent caches one lazy component per tool */}
            <ToolComponent key={tool.id} />
          </Suspense>
        </ServerGate>
      </CardContent>
    </Card>
  )
}
