'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useModalStore } from '@/providers/modal'
import { getModalParams, ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import React from 'react'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicMovieNoteCreatorDialogContent = dynamic(
  () => import('./movie-note-creator-dialog-content'),
  { loading: () => <LoadingDialogContent /> },
)

export type MovieNoteCreatorDialogParams = {
  movieId: string
}

export default function MovieNoteCreatorDialog() {
  const { currentModal, closeModal } = useModalStore(
    (state) => state,
  )
  const rawModalParams = useModalStore((state) => state.modalParams)
  const params = React.useMemo(
    () => getModalParams(ModalType.MovieNoteCreator, rawModalParams),
    [rawModalParams],
  )

  const isOpen = React.useMemo(
    () => currentModal === ModalType.MovieNoteCreator && params !== undefined,
    [currentModal, params],
  )

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-h-svh overflow-y-auto">
        {isOpen && (
          <DynamicMovieNoteCreatorDialogContent
            contentId={params!.movieId}
            isDesktop={true}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
