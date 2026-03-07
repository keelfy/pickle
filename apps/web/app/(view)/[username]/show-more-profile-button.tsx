'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import React from 'react'

export default function ShowMoreProfileButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { openModal } = useModalStore((state) => state)

  return (
    <Button
      variant="link"
      size="sm"
      className={cn(
        'h-min p-0 text-sm text-muted-foreground underline-offset-2',
        className,
      )}
      onClick={() => openModal(ModalType.ShowMoreProfile)}
      {...props}
    >
      ..show more
    </Button>
  )
}
