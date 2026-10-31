import { useMemo, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CodeTextarea } from '@/components/io/CodeTextarea'
import { CopyButton } from '@/components/io/CopyButton'
import { urlCodec, type Mode, type Scope } from './logic'

type Result = { ok: true; value: string } | { ok: false; message: string }

export default function UrlCodec() {
  const [mode, setMode] = useState<Mode>('encode')
  const [scope, setScope] = useState<Scope>('component')
  const [plusAsSpace, setPlusAsSpace] = useState(false)
  const [text, setText] = useState('')

  // Cheap enough to compute live as the user types.
  const result = useMemo<Result | null>(() => {
    if (!text) return null
    try {
      return { ok: true, value: urlCodec(text, mode, scope, plusAsSpace) }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) }
    }
  }, [text, mode, scope, plusAsSpace])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="group" aria-label="Mode">
        {(['encode', 'decode'] as const).map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={mode === m ? 'default' : 'outline'}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            {m === 'encode' ? 'Encode' : 'Decode'}
          </Button>
        ))}
      </div>
      {mode === 'encode' ? (
        <div className="flex gap-2" role="group" aria-label="Scope">
          {(['component', 'url'] as const).map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={scope === s ? 'secondary' : 'outline'}
              aria-pressed={scope === s}
              onClick={() => setScope(s)}
            >
              {s === 'component' ? 'Component' : 'Full URL'}
            </Button>
          ))}
        </div>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={plusAsSpace}
            onChange={(e) => setPlusAsSpace(e.target.checked)}
          />
          Treat “+” as space
        </label>
      )}
      <div className="grid gap-2">
        <Label htmlFor="url-input">{mode === 'encode' ? 'Text' : 'Encoded text'}</Label>
        <CodeTextarea
          id="url-input"
          className="h-40"
          value={text}
          placeholder={
            mode === 'encode'
              ? 'https://example.com/search?q=hello world'
              : 'hello%20world%20%26%20more'
          }
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
            <Label htmlFor="url-output">Result</Label>
            <CopyButton value={result.value} />
          </div>
          <CodeTextarea id="url-output" className="h-40" readOnly value={result.value} />
        </div>
      )}
    </div>
  )
}
