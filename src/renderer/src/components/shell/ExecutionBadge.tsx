import { Cloud, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Execution } from '@/catalog/types'

export function ExecutionBadge({ execution }: { execution: Execution }) {
  return execution === 'client' ? (
    <Badge variant="secondary" title="Your data is processed in this browser and never sent anywhere.">
      <ShieldCheck aria-hidden="true" />
      Runs locally
    </Badge>
  ) : (
    <Badge variant="outline" title="Your input is sent to this app's server for processing. It is not stored.">
      <Cloud aria-hidden="true" />
      Sends data to server
    </Badge>
  )
}
