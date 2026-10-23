import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; csv: string; filename: string; source: string }

type Mode = 'file' | 'paste'

const PREVIEW_CHARS = 2000

export default function JsonToCsv() {
  const [mode, setMode] = useState<Mode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [path, setPath] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const hasInput = mode === 'file' ? file !== null : text.trim() !== ''

  async function convert() {
    if (!hasInput) return
    setStatus({ kind: 'loading' })
    const body = new FormData()
    if (mode === 'file' && file) body.append('file', file)
    else body.append('text', text)
    if (path.trim()) body.append('path', path.trim())
    try {
      const res = await fetch('/api/tools/json-to-csv/convert', {
        method: 'POST',
        body,
      })
      if (!res.ok) {
        const detail = await res
          .json()
          .then((d: { detail?: string }) => d.detail)
          .catch(() => undefined)
        setStatus({ kind: 'error', message: detail ?? `Request failed (${res.status})` })
        return
      }
      setStatus({
        kind: 'done',
        csv: await res.text(),
        filename:
          mode === 'file' && file ? file.name.replace(/\.[^.]+$/, '') + '.csv' : 'converted.csv',
        source: res.headers.get('X-Source-Path') ?? '',
      })
    } catch {
      setStatus({ kind: 'error', message: 'Could not reach the server.' })
    }
  }

  function download() {
    if (status.kind !== 'done') return
    const url = URL.createObjectURL(new Blob([status.csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = status.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'file' ? 'default' : 'outline'}
          onClick={() => {
            setMode('file')
            setStatus({ kind: 'idle' })
          }}
        >
          Upload file
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'paste' ? 'default' : 'outline'}
          onClick={() => {
            setMode('paste')
            setStatus({ kind: 'idle' })
          }}
        >
          Paste JSON
        </Button>
      </div>
      {mode === 'file' ? (
        <div className="grid gap-2">
          <Label htmlFor="json-file">JSON file</Label>
          <Input
            id="json-file"
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setStatus({ kind: 'idle' })
            }}
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="json-text">JSON</Label>
          <textarea
            id="json-text"
            value={text}
            spellCheck={false}
            placeholder='[{"id": 1, "name": "Ada"}]'
            onChange={(e) => {
              setText(e.target.value)
              setStatus({ kind: 'idle' })
            }}
            className="h-48 w-full rounded-lg border border-input bg-transparent p-2.5 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="json-path">Array key / path (optional)</Label>
        <Input
          id="json-path"
          value={path}
          placeholder="e.g. data.items — leave empty to auto-detect"
          onChange={(e) => {
            setPath(e.target.value)
            setStatus({ kind: 'idle' })
          }}
        />
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={convert}
          disabled={!hasInput || status.kind === 'loading'}
        >
          {status.kind === 'loading' ? 'Converting…' : 'Convert'}
        </Button>
        {status.kind === 'done' && (
          <Button type="button" variant="outline" onClick={download}>
            Download {status.filename}
          </Button>
        )}
      </div>
      {status.kind === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
      {status.kind === 'done' && status.source && (
        <p className="text-sm text-muted-foreground">
          Converted array: <code>{status.source}</code>
        </p>
      )}
      {status.kind === 'done' && (
        <ScrollArea className="h-80 rounded-md border bg-muted">
          <pre className="p-3 font-mono text-sm">
            {status.csv.length > PREVIEW_CHARS
              ? status.csv.slice(0, PREVIEW_CHARS) + '\n…'
              : status.csv}
          </pre>
        </ScrollArea>
      )}
    </div>
  )
}
