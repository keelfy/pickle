import { Badge } from '@/components/ui/badge'
import { ContentNoteStatusIcon } from '@/components/ui/content-note/content-note-status-icon'
import { localizeContentNoteStatus } from '@/lib/localize-types'
import { cn } from '@/lib/utils'
import { ContentNoteStatus } from '@/lib/model/content-note'
import { GameNoteStatus, MovieNoteStatus } from '@/lib/model/content-note'

type Props = React.ComponentProps<typeof Badge> & {
  status: ContentNoteStatus | undefined
  className?: string
}

export const getStatusBadgeVariant = (
  status: GameNoteStatus | MovieNoteStatus | undefined,
) => {
  switch (status) {
    case 'dropped':
    case 'skipped':
      return 'destructive'
    case 'finished':
    case 'watched':
    case 'playing':
      return 'default'
    case 'paused':
    case 'planned':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default function ContentNoteStatusBadge({
  status,
  className,
  ...props
}: Props) {
  const statusLabel = localizeContentNoteStatus(status)
  const statusBadgeVariant = getStatusBadgeVariant(status)

  return (
    <Badge
      variant={statusBadgeVariant}
      className={cn('flex h-min w-min items-center gap-1', className)}
      {...props}
    >
      <ContentNoteStatusIcon status={status ?? 'planned'} className="size-4" />
      <label>{statusLabel}</label>
    </Badge>
  )
}
