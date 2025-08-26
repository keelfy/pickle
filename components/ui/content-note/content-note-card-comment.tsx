'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/providers/profile-store'

type Props = {
  comment?: string
  className?: string
  onShowMore?: () => void
}

export default function ContentNoteCardComment({
  comment,
  className,
  onShowMore,
}: Props) {
  const profile = useProfileStore((state) => state.profile)
  return (
    <div
      className={cn(
        'h-min w-full rounded-md bg-primary-foreground p-4 text-sm',
        className,
      )}
    >
      {comment && comment.length > 0 ? (
        <div className="flex flex-col gap-0">
          <div
            className={cn('whitespace-pre-wrap', onShowMore && 'line-clamp-3')}
          >
            {comment}
          </div>
          <Button
            variant="link"
            className={cn('m-0 w-fit p-0', !onShowMore && 'hidden')}
            onClick={onShowMore}
          >
            Show more
          </Button>
        </div>
      ) : (
        <span className="text-muted-foreground">
          {profile?.displayName ?? 'The user'} hasn&apos;t left a comment yet.
        </span>
      )}
    </div>
  )
}
