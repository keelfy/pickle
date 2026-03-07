'use client'

import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog'
import { useModalStore } from '@/providers/modal'
import { getModalParams, ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingAlertDialogContent from '../loading-alert-dialog-content'

const DynamicRejectOrderDialogContent = dynamic(
  () => import('./reject-order-dialog-content'),
  {
    loading: () => <LoadingAlertDialogContent />,
  },
)

export type RejectOrderDialogParams = {
  id: string
  message?: string
  odn?: string
}

export default function RejectOrderDialog() {
  const { currentModal, closeModal } = useModalStore((state) => state)
  const rawModalParams = useModalStore((state) => state.modalParams)
  const modalParams = React.useMemo(
    () => getModalParams(ModalType.RejectOrder, rawModalParams),
    [rawModalParams],
  )

  const isOpen = React.useMemo(
    () =>
      currentModal === ModalType.RejectOrder && modalParams?.id !== undefined,
    [currentModal, modalParams?.id],
  )

  if (!isOpen) {
    return null
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={closeModal}>
      <AlertDialogContent>
        {isOpen && <DynamicRejectOrderDialogContent />}
      </AlertDialogContent>
    </AlertDialog>
  )
}
