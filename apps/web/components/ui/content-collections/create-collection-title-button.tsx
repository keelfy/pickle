'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import { PlusIcon } from 'lucide-react'

type Props = {
  className?: string
}

export default function CreateCollectionTitleButton({ className }: Props) {
  const openModal = useModalStore((state) => state.openModal)

  return (
    <Button
      variant="link"
      className={cn(
        'flex flex-shrink-0 items-center gap-2 p-0 text-start text-muted-foreground',
        className,
      )}
      onClick={() => openModal(ModalType.CreateCollection)}
    >
      <PlusIcon />
      <h2 className="text-lg">Untitled collection</h2>
    </Button>
  )
}
