'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicShowMoreProfileDialogContent = dynamic(
  () => import('./show-more-profile-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export default function ShowMoreProfileDialog() {
  const { currentModal, closeModal } = useModalStore((state) => state)

  const isOpen = React.useMemo(
    () => currentModal === ModalType.ShowMoreProfile,
    [currentModal],
  )

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-h-screen overflow-y-auto">
        {isOpen && <DynamicShowMoreProfileDialogContent />}
      </DialogContent>
    </Dialog>
  )
}
