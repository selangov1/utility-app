import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CodeTextarea } from '@/components/io/CodeTextarea'
import { CopyButton } from '@/components/io/CopyButton'
import { DownloadButton } from '@/components/io/DownloadButton'
import { FileInput } from '@/components/io/FileInput'
import { decodeUtf8, jsonToCsv, type CsvResult } from './logic'

type Status =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | ({ kind: 'done'; filename: string } & CsvResult)

type Mode = 'file' | 'paste'

const PREVIEW_CHARS = 2000

export default function JsonToCsv() {
  const [mode, setMode] = useState<Mode>('paste')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [path, setPath] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const hasInput = mode === 'file' ? file !== null : text.trim() !== ''
  const reset = () => setStatus({ kind: 'idle' })

  async function convert() {
    if (!hasInput) return
    try {
      const content = mode === 'file' && file ? decodeUtf8(await file.arrayBuffer()) : text
      const result = jsonToCsv(content, path)
      setStatus({
        kind: 'done',
        filename:
          mode === 'file' && file ? file.name.replace(/\.[^.]+$/, '') + '.csv' : 'converted.csv',
        ...result,
      })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="group" aria-label="Input source">
        {(['paste', 'file'] as const).map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={mode === m ? 'default' : 'outline'}
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m)
              reset()
            }}
          >
            {m === 'paste' ? 'Paste JSON' : 'Open file'}
          </Button>
        ))}
      </div>
      {mode === 'file' ? (
        <div className="grid gap-2">
          <Label htmlFor="json-file">JSON file</Label>
          <FileInput
            id="json-file"
            accept=".json,application/json"
            onFile={(f) => {
              setFile(f)
              reset()
            }}
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="json-text">JSON</Label>
          <CodeTextarea
            id="json-text"
            value={text}
            placeholder='[{"id": 1, "name": "Ada"}]'
            onChange={(e) => {
              setText(e.target.value)
              reset()
            }}
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="json-path">Array key / path (optional)</Label>
        <Input
          id="json-path"
          value={path}
          autoComplete="off"
          placeholder="e.g. data.items — leave empty to auto-detect"
          onChange={(e) => {
            setPath(e.target.value)
            reset()
          }}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={convert} disabled={!hasInput}>
          Convert
        </Button>
        {status.kind === 'done' && (
          <>
            <DownloadButton content={status.csv} filename={status.filename} type="text/csv" />
            <CopyButton value={status.csv} />
          </>
        )}
      </div>
      {status.kind === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
      {status.kind === 'done' && (
        <>
          <p className="text-sm text-muted-foreground">
            {status.rows} rows × {status.columns} columns
            {status.source && (
              <>
                {' '}
                from <code>{status.source}</code>
              </>
            )}
          </p>
          <ScrollArea className="h-80 rounded-md border bg-muted">
            <pre className="p-3 font-mono text-sm">
              {status.csv.length > PREVIEW_CHARS
                ? status.csv.slice(0, PREVIEW_CHARS) + '\n…'
                : status.csv}
            </pre>
          </ScrollArea>
        </>
      )}
    </div>
  )
}
