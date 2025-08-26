'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'
import { useIsDesktop } from '@/lib/use-media-query'

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
  const isDesktop = useIsDesktop()

  return (
    <DialogWrapper
      modalType={ModalType.MovieNote}
      validateModalParams={(params) => {
        return typeof params?.noteId === 'string' && params.noteId.length > 0
      }}
      isDesktop={isDesktop}
    >
      <DynamicMovieNoteDialogContent
        noteId={modalParams!.noteId as string}
        isDesktop={isDesktop}
      />
    </DialogWrapper>
  )
}
