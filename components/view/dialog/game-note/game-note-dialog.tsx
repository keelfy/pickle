'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useModalStore } from '@/providers/modal'
import { getModalParams, ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'
import { useIsDesktop } from '@/lib/use-media-query'
import React from 'react'

const DynamicGameNoteDialogContent = dynamic(
  () => import('./game-note-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export type GameNoteDialogParams = {
  noteId: string
}

export default function GameNoteDialog() {
  const rawModalParams = useModalStore((state) => state.modalParams)
  const params = React.useMemo(
    () => getModalParams(ModalType.GameNote, rawModalParams),
    [rawModalParams],
  )
  const isDesktop = useIsDesktop()
  return (
    <DialogWrapper
      modalType={ModalType.GameNote}
      validateModalParams={(params) => {
        return typeof params?.noteId === 'string' && params.noteId.length > 0
      }}
      isDesktop={isDesktop}
    >
      <DynamicGameNoteDialogContent
        noteId={params!.noteId}
        isDesktop={isDesktop}
      />
    </DialogWrapper>
  )
}
