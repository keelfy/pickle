'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useModalStore } from '@/providers/modal'
import { getModalParams, ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingDialogContent from '../loading-dialog-content'
import { useIsDesktop } from '@/lib/use-media-query'

const DynamicGameNoteCreatorDialogContent = dynamic(
  () => import('./game-note-creator-dialog-content'),
  { loading: () => <LoadingDialogContent /> },
)

export type GameNoteCreatorDialogParams = {
  gameId: string
}

export default function GameNoteCreatorDialog() {
  const rawModalParams = useModalStore((state) => state.modalParams)
  const params = React.useMemo(
    () => getModalParams(ModalType.GameNoteCreator, rawModalParams),
    [rawModalParams],
  )
  const isDesktop = useIsDesktop()

  return (
    <DialogWrapper
      modalType={ModalType.GameNoteCreator}
      validateModalParams={(params) => params.gameId !== undefined}
      isDesktop={isDesktop}
    >
      <DynamicGameNoteCreatorDialogContent
        contentId={params!.gameId}
        isDesktop={isDesktop}
      />
    </DialogWrapper>
  )
}
