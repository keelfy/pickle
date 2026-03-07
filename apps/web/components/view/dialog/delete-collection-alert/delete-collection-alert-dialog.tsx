'use client'

import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingAlertDialogContent from '../loading-alert-dialog-content'

const DynamicDeleteCollectionAlertDialogContent = dynamic(
  () => import('./delete-collection-alert-dialog-content'),
  {
    loading: () => <LoadingAlertDialogContent />,
  },
)

export type DeleteCollectionAlertModalParams = {
  id: string
  name: string
}

export default function DeleteCollectionAlertDialog() {
  const { currentModal, closeModal } = useModalStore((state) => state)

  const modalParams = useModalStore<
    DeleteCollectionAlertModalParams | undefined
  >(
    (state) =>
      state.modalParams as DeleteCollectionAlertModalParams | undefined,
  )

  const isOpen = React.useMemo(
    () =>
      currentModal === ModalType.DeleteCollectionAlert &&
      modalParams?.id !== undefined &&
      modalParams?.name !== undefined,
    [currentModal, modalParams?.id, modalParams?.name],
  )

  return (
    <AlertDialog open={isOpen} onOpenChange={closeModal}>
      <AlertDialogContent>
        {isOpen && <DynamicDeleteCollectionAlertDialogContent />}
      </AlertDialogContent>
    </AlertDialog>
  )
}
