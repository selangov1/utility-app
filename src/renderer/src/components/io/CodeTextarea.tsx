import type { ComponentProps } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/** Monospace textarea for code/data input. Never autocompletes or spellchecks user data. */
export function CodeTextarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <Textarea
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      data-gramm="false"
      className={cn('field-sizing-fixed h-48 resize-y font-mono text-sm', className)}
      {...props}
    />
  )
}
