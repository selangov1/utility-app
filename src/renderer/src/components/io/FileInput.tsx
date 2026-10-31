import { Input } from '@/components/ui/input'

/** File picker that hands the File to the caller for local reading; it never uploads. */
export function FileInput({
  id,
  accept,
  onFile,
}: {
  id: string
  accept?: string
  onFile: (file: File | null) => void
}) {
  return (
    <Input id={id} type="file" accept={accept} onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
  )
}
