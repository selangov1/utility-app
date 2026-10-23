import { useEffect, useState } from 'react'
import { toolComponents } from './tools'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ThemeSelector } from '@/components/ThemeSelector'

interface ToolInfo {
  id: string
  name: string
  description: string
}

function App() {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tools')
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        return res.json() as Promise<ToolInfo[]>
      })
      .then((list) => {
        const known = list.filter((t) => t.id in toolComponents)
        setTools(known)
        setActiveId((current) => current ?? known[0]?.id ?? null)
      })
      .catch(() => setError('Could not load tools from the server.'))
  }, [])

  const active = tools.find((t) => t.id === activeId)
  const ActiveTool = active ? toolComponents[active.id] : null

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <nav
        className="flex w-full shrink-0 flex-col border-b p-4 md:w-60 md:border-r md:border-b-0"
        aria-label="Tools"
      >
        <h1 className="mb-4 text-xl font-semibold tracking-tight">Utility App</h1>
        <Separator className="mb-4" />
        <ul className="flex flex-col gap-1">
          {tools.map((t) => (
            <li key={t.id}>
              <Button
                type="button"
                variant={t.id === activeId ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                aria-current={t.id === activeId ? 'page' : undefined}
                onClick={() => setActiveId(t.id)}
              >
                {t.name}
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-4 md:mt-auto md:pt-4">
          <ThemeSelector />
        </div>
      </nav>
      <main className="min-w-0 flex-1 p-6 md:p-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {active && ActiveTool && (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>{active.name}</CardTitle>
              <CardDescription>{active.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveTool key={active.id} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export default App
