import { cn } from '@/lib/utils'
import React from 'react'

type Props = React.ComponentProps<'p'> & {
  description: string | undefined
}

export default function ProfileDescription({
  description,
  className,
  ...props
}: Props) {
  return (
    <p
      className={cn(
        'line-clamp-1 max-w-96 text-sm text-muted-foreground',
        className,
      )}
      {...props}
    >
      {(description ?? '').length > 0
        ? description
        : 'No description provided.'}
    </p>
  )
}
