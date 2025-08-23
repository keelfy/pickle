'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicEditCollectionDialogContent = dynamic(
  () => import('./edit-collection-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export type EditCollectionModalParams = {
  id: string
}

export default function EditCollectionDialog() {
  const { currentModal, closeModal, modalParams } = useModalStore(
    (state) => state,
  )

  const isOpen = React.useMemo(
    () =>
      currentModal === ModalType.EditCollection &&
      modalParams?.id !== undefined,
    [currentModal, modalParams?.id],
  )

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-h-screen overflow-y-auto">
        {isOpen && <DynamicEditCollectionDialogContent />}
      </DialogContent>
    </Dialog>
  )
}
