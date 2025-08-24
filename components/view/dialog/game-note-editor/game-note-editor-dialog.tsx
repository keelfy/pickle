'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
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
  const { currentModal, modalParams, closeModal } = useModalStore(
    (state) => state,
  )

  const isOpen = React.useMemo(
    () =>
      currentModal === ModalType.GameNoteEditor &&
      modalParams?.noteId !== undefined,
    [currentModal, modalParams?.noteId],
  )

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-h-svh overflow-y-auto">
        {isOpen && (
          <DynamicGameNoteEditorDialogContent
            noteId={modalParams?.noteId as string}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
