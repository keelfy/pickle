'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useIsDesktop } from '@/lib/use-media-query'
import { useModalStore } from '@/providers/modal'
import { getModalParams, ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicGameNoteEditorDialogContent = dynamic(
  () => import('./game-note-editor-dialog-content'),
  { loading: () => <LoadingDialogContent /> },
)

export type GameNoteEditorDialogParams = {
  noteId: string
}

export default function GameNoteEditorDialog() {
  const rawModalParams = useModalStore((state) => state.modalParams)
  const params = React.useMemo(
    () => getModalParams(ModalType.GameNoteEditor, rawModalParams),
    [rawModalParams],
  )
  const isDesktop = useIsDesktop()

  return (
    <DialogWrapper
      modalType={ModalType.GameNoteEditor}
      validateModalParams={(params) => params.noteId !== undefined}
      isDesktop={isDesktop}
    >
      <DynamicGameNoteEditorDialogContent
        noteId={params!.noteId}
        isDesktop={isDesktop}
      />
    </DialogWrapper>
  )
}
