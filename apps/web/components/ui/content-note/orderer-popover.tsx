import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Orderer } from '@/lib/model/orderer'
import { ExternalLinkIcon } from '@radix-ui/react-icons'
import { PopoverClose, PopoverProps } from '@radix-ui/react-popover'
import { XIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Popover, PopoverContent } from '../popover'

type Props = React.PropsWithChildren<{
  orderer?: Orderer
  side?: 'top' | 'bottom' | 'left' | 'right'
}> &
  PopoverProps

const GetSourceDisplayName = (source: string) => {
  switch (source) {
    case 'twitch':
      return 'Twitch'
    case 'pickle':
      return 'Pickle'
  }
}

export default function OrdererPopover({
  orderer,
  children,
  side,
  ...props
}: Props) {
  return (
    <Popover {...props}>
      {children}
      <PopoverContent side={side} align="start">
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarImage src={orderer?.avatarUrl} />
            <AvatarFallback>{orderer?.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5">
            {orderer?.url ? (
              <Button variant="link" className="group h-min p-0">
                <Link href={orderer?.url} target="_blank">
                  <div className="flex items-center gap-2">
                    <p className="text-md font-semibold">
                      {orderer?.displayName}
                    </p>
                    <ExternalLinkIcon className="size-3 text-foreground/80 transition-colors group-hover:text-foreground" />
                  </div>
                </Link>
              </Button>
            ) : (
              <p className="text-sm font-semibold">{orderer?.displayName}</p>
            )}
            <p className="text-sm text-muted-foreground">
              via {GetSourceDisplayName(orderer?.source ?? '')}
            </p>
          </div>
          <PopoverClose>
            <XIcon className="absolute right-2 top-2 size-4 text-foreground/80 transition-colors hover:text-foreground" />
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  )
}
