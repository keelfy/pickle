'use client'

import { useIsDesktop } from '@/lib/use-media-query'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'
import DialogWrapper from '@/components/ui/dialog-wrapper'

const DynamicMovieNoteEditorDialogContent = dynamic(
  () => import('./movie-note-editor-dialog-content'),
  { loading: () => <LoadingDialogContent /> },
)

export type MovieNoteEditorDialogParams = {
  noteId: string
}

export default function MovieNoteEditorDialog() {
  const modalParams = useModalStore((state) => state.modalParams)
  const isDesktop = useIsDesktop()

  return (
    <DialogWrapper
      modalType={ModalType.MovieNoteEditor}
      validateModalParams={(params) => params.noteId !== undefined}
      isDesktop={isDesktop}
    >
      <DynamicMovieNoteEditorDialogContent
        noteId={modalParams?.noteId as string}
      />
    </DialogWrapper>
  )
}
