import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Downloads generated content via a local blob URL; nothing leaves the browser. */
export function DownloadButton({
  content,
  filename,
  type = 'text/plain',
}: {
  content: string
  filename: string
  type?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const url = URL.createObjectURL(new Blob([content], { type }))
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 0)
      }}
    >
      <Download aria-hidden="true" />
      Download {filename}
    </Button>
  )
}
