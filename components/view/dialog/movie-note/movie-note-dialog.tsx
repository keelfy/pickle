'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicMovieNoteDialogContent = dynamic(
  () => import('./movie-note-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export type MovieNoteDialogParams = {
  noteId: string
}

export default function MovieNoteDialog() {
  const modalParams = useModalStore((state) => state.modalParams)

  return (
    <DialogWrapper
      modalType={ModalType.MovieNote}
      validateModalParams={(params) => {
        return typeof params?.noteId === 'string' && params.noteId.length > 0
      }}
    >
      <DynamicMovieNoteDialogContent noteId={modalParams!.noteId as string} />
    </DialogWrapper>
  )
}
