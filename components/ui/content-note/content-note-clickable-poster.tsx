'use client'

import { cn } from '@/lib/utils'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import { ContentCategory } from '@/lib/model/content'
import { GameNoteDialogParams } from '../../view/dialog/game-note/game-note-dialog'
import ContentNotePoster from './content-note-poster'
import { MovieNoteDialogParams } from '@/components/view/dialog/movie-note/movie-note-dialog'
import { ImageSize } from '@/lib/model/types'

type Props = {
  contentId: string
  coverUrl: string
  category: ContentCategory
  size?: ImageSize
  className?: string
  loading?: boolean
  alt?: string
}

export default function ContentNoteClickablePoster({
  size = 'sm',
  className,
  loading = false,
  contentId,
  coverUrl,
  category,
  alt,
}: Props) {
  const openModal = useModalStore((state) => state.openModal)

  const handleClick = () => {
    switch (category) {
      case 'games':
        const gameParams: GameNoteDialogParams = {
          noteId: contentId,
        }
        openModal(ModalType.GameNote, gameParams)
        break
      case 'movies':
        const movieParams: MovieNoteDialogParams = {
          noteId: contentId,
        }
        openModal(ModalType.MovieNote, movieParams)
        break
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-md border-none p-0 transition-all duration-300 hover:scale-105 hover:shadow-2xl',
        className,
      )}
    >
      <ContentNotePoster
        posterUrl={coverUrl}
        size={size}
        loading={loading}
        className="cursor-pointer"
        alt={alt}
      />
    </button>
  )
}
