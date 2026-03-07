import { ProfileCounts } from '@/lib/model/user'
import { cn } from '@/lib/utils'
import { ClapperboardIcon, GamepadIcon } from 'lucide-react'
import React from 'react'

type Props = React.ComponentProps<'div'> & {
  counts: ProfileCounts | undefined
}

export default function ProfileCountStats({
  counts,
  className,
  ...props
}: Props) {
  return (
    <div
      className={cn('hidden items-center justify-end gap-6 lg:flex', className)}
      {...props}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center gap-2">
          <GamepadIcon className="size-8" />
          <div className="text-xl font-semibold"> {counts?.played ?? 0}</div>
        </div>
        <p className="text-xs lowercase text-muted-foreground">played</p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center gap-2">
          <ClapperboardIcon className="size-8" />
          <div className="text-xl font-semibold">{counts?.watched ?? 0}</div>
        </div>
        <p className="text-xs lowercase text-muted-foreground">watched</p>
      </div>
    </div>
  )
}
