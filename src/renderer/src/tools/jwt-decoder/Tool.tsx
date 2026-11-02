import { useMemo, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { CodeTextarea } from '@/components/io/CodeTextarea'
import { CopyButton } from '@/components/io/CopyButton'
import { decodeJwt } from './logic'

type Result =
  | { ok: true; header: string; payload: string; signature: string }
  | { ok: false; message: string }

export default function JwtDecoder() {
  const [token, setToken] = useState('')

  const result = useMemo<Result | null>(() => {
    if (!token.trim()) return null
    try {
      const decoded = decodeJwt(token)
      return {
        ok: true,
        header: JSON.stringify(decoded.header, null, 2),
        payload: JSON.stringify(decoded.payload, null, 2),
        signature: decoded.signature,
      }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) }
    }
  }, [token])

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Decoding does not verify the signature. Treat the displayed claims as untrusted.
        </AlertDescription>
      </Alert>
      <div className="grid gap-2">
        <Label htmlFor="jwt-decoder-input">JWT</Label>
        <CodeTextarea
          id="jwt-decoder-input"
          className="h-32"
          value={token}
          placeholder="Paste a compact JWT"
          onChange={(event) => setToken(event.target.value)}
        />
      </div>
      {result && !result.ok && (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
      {result?.ok && (
        <>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jwt-decoder-header">Header</Label>
              <CopyButton value={result.header} />
            </div>
            <CodeTextarea id="jwt-decoder-header" className="h-36" readOnly value={result.header} />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jwt-decoder-payload">Payload</Label>
              <CopyButton value={result.payload} />
            </div>
            <CodeTextarea
              id="jwt-decoder-payload"
              className="h-48"
              readOnly
              value={result.payload}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jwt-decoder-signature">Signature segment</Label>
              <CopyButton value={result.signature} />
            </div>
            <CodeTextarea
              id="jwt-decoder-signature"
              className="h-20"
              readOnly
              value={result.signature}
            />
          </div>
        </>
      )}
    </div>
  )
}