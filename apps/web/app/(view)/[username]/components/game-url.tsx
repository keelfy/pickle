'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = React.ComponentProps<typeof Button> & {
  url?: string
  className?: string
  children?: React.ReactNode
}

const GameUrl = ({ url, className, ...props }: Props) => {
  return (
    <Button
      variant="link"
      size="sm"
      asChild
      className={cn(className, 'p-0')}
      {...props}
    >
      <Link href={url ?? ''} target="_blank">
        <ExternalLinkIcon className="h-4 w-4" />
        IGDB
      </Link>
    </Button>
  )
}

export default GameUrl
