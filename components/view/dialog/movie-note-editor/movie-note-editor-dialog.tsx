'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicMovieNoteEditorDialogContent = dynamic(
  () => import('./movie-note-editor-dialog-content'),
  { loading: () => <LoadingDialogContent /> },
)

export type MovieNoteEditorDialogParams = {
  noteId: string
}

export default function MovieNoteEditorDialog() {
  const { currentModal, modalParams, closeModal } = useModalStore(
    (state) => state,
  )

  const isOpen = React.useMemo(
    () =>
      currentModal === ModalType.MovieNoteEditor &&
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
          <DynamicMovieNoteEditorDialogContent
            noteId={modalParams?.noteId as string}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
