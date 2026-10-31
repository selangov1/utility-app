import { useMemo, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CodeTextarea } from '@/components/io/CodeTextarea'
import { CopyButton } from '@/components/io/CopyButton'
import { stringifyJson, type Indent } from './logic'

type Result = { ok: true; value: string } | { ok: false; message: string }

const INDENTS: readonly { id: Indent; label: string }[] = [
  { id: '2', label: '2 spaces' },
  { id: '4', label: '4 spaces' },
  { id: 'tab', label: 'Tab' },
  { id: 'min', label: 'Minified' },
]

export default function JsonStringify() {
  const [text, setText] = useState('')
  const [indent, setIndent] = useState<Indent>('2')
  const [asString, setAsString] = useState(false)

  const result = useMemo<Result | null>(() => {
    if (!text.trim()) return null
    try {
      return { ok: true, value: stringifyJson(text, indent, asString) }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) }
    }
  }, [text, indent, asString])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Indentation">
        {INDENTS.map((o) => (
          <Button
            key={o.id}
            type="button"
            size="sm"
            variant={indent === o.id ? 'default' : 'outline'}
            aria-pressed={indent === o.id}
            onClick={() => setIndent(o.id)}
          >
            {o.label}
          </Button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={asString}
          onChange={(e) => setAsString(e.target.checked)}
        />
        Escape as string literal
      </label>
      <div className="grid gap-2">
        <Label htmlFor="json-stringify-input">JSON</Label>
        <CodeTextarea
          id="json-stringify-input"
          className="h-48"
          value={text}
          placeholder='{"name": "Ada", "tags": ["a", "b"]}'
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {result && !result.ok && (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
      {result?.ok && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="json-stringify-output">Result</Label>
            <CopyButton value={result.value} />
          </div>
          <CodeTextarea id="json-stringify-output" className="h-48" readOnly value={result.value} />
        </div>
      )}
    </div>
  )
}
