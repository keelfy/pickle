'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicCreateCollectionDialogContent = dynamic(
  () => import('./create-collection-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export default function CreateCollectionDialog() {
  const { currentModal, closeModal } = useModalStore((state) => state)

  const isOpen = React.useMemo(
    () => currentModal === ModalType.CreateCollection,
    [currentModal],
  )

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-h-svh overflow-y-auto">
        {isOpen && <DynamicCreateCollectionDialogContent />}
      </DialogContent>
    </Dialog>
  )
}
