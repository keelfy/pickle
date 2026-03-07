'use client'

import { Dialog } from '@/components/ui/dialog'
import { useModalStore } from '@/providers/modal'

export default function DropdownMenuDialogWrapper({
  children,
}: React.PropsWithChildren) {
  const { currentModal, closeModal } = useModalStore((state) => state)

  return (
    <Dialog open={currentModal !== undefined} onOpenChange={closeModal}>
      {children}
    </Dialog>
  )
}
