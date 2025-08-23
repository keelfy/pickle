'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useModalStore } from '@/providers/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingDialogContent from '../loading-dialog-content'
import { ModalType } from '@/stores/modal'

const DynamicCreateOrderDialogContent = dynamic(
  () => import('./create-order-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export default function CreateOrderDialog() {
  const { currentModal, closeModal } = useModalStore((state) => state)

  const isOpen = React.useMemo(
    () => currentModal === ModalType.CreateOrder,
    [currentModal],
  )

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-h-screen overflow-y-auto">
        {isOpen && <DynamicCreateOrderDialogContent />}
      </DialogContent>
    </Dialog>
  )
}
