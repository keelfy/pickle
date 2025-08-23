'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import React from 'react'

type Props = {
  comment?: string
  lengthLimit?: number
  className?: string
}

export default function ContentNoteCardComment({
  comment,
  className,
  lengthLimit = 350,
}: Props) {
  const [isCommentExpanded, setCommentIsExpanded] = React.useState(false)

  return (
    <div
      className={cn(
        'h-min w-full rounded-md bg-primary-foreground p-4 text-sm',
        comment && comment.length > lengthLimit && 'pb-2',
        className,
      )}
    >
      {comment && comment.length > 0 ? (
        <div className="flex flex-col gap-0">
          <div
            className={cn(
              'whitespace-pre-wrap',
              !isCommentExpanded && 'line-clamp-3 text-ellipsis',
            )}
          >
            {comment}
          </div>
          <Button
            variant="link"
            className={cn(
              'm-0 w-fit p-0',
              comment.length <= lengthLimit && 'hidden',
            )}
            onClick={() => setCommentIsExpanded(!isCommentExpanded)}
          >
            {isCommentExpanded ? 'Show less' : 'View more'}
          </Button>
        </div>
      ) : (
        <span className="text-muted-foreground">
          keelfy hasn&apos;t left a comment yet.
        </span>
      )}
    </div>
  )
}
