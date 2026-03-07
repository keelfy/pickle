'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useModalStore } from '@/providers/modal'
import { getModalParams, ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'
import { useIsDesktop } from '@/lib/use-media-query'
import React from 'react'

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
  const rawModalParams = useModalStore((state) => state.modalParams)
  const params = React.useMemo(
    () => getModalParams(ModalType.MovieNote, rawModalParams),
    [rawModalParams],
  )
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
        noteId={params!.noteId}
        isDesktop={isDesktop}
      />
    </DialogWrapper>
  )
}
