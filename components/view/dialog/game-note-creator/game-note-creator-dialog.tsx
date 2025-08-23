'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicGameNoteCreatorDialogContent = dynamic(
  () => import('./game-note-creator-dialog-content'),
  { loading: () => <LoadingDialogContent /> },
)

export type GameNoteCreatorDialogParams = {
  gameId: string
}

export default function GameNoteCreatorDialog() {
  const modalParams = useModalStore((state) => state.modalParams)

  return (
    <DialogWrapper
      modalType={ModalType.GameNoteCreator}
      validateModalParams={(params) => params.gameId !== undefined}
    >
      <DynamicGameNoteCreatorDialogContent
        contentId={modalParams?.gameId as string}
      />
    </DialogWrapper>
  )
}
