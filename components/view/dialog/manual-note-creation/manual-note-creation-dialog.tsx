'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicManualNoteCreationDialogContent = dynamic(
  () => import('./manual-note-creation-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export default function ManualNoteCreationDialog() {
  return (
    <DialogWrapper modalType={ModalType.ManualNoteCreation}>
      <DynamicManualNoteCreationDialogContent />
    </DialogWrapper>
  )
}
