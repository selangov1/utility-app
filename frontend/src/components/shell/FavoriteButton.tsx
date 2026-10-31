import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/catalog/preferences'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  toolId,
  toolName,
  size = 'icon-sm',
  className,
}: {
  toolId: string
  toolName: string
  size?: 'icon-sm' | 'icon-xs'
  className?: string
}) {
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(toolId)
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={className}
      aria-pressed={active}
      aria-label={active ? `Remove ${toolName} from favorites` : `Add ${toolName} to favorites`}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(toolId)
      }}
    >
      <Star aria-hidden="true" className={cn(active && 'fill-current text-amber-500')} />
    </Button>
  )
}
