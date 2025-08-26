'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useIsDesktop } from '@/lib/use-media-query'
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
  const isDesktop = useIsDesktop()
  return (
    <DialogWrapper
      modalType={ModalType.ManualNoteCreation}
      isDesktop={isDesktop}
    >
      <DynamicManualNoteCreationDialogContent isDesktop={isDesktop!} />
    </DialogWrapper>
  )
}
