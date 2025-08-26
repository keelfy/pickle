'use client'

import { DetailedMovieNote } from '@/lib/model/content-note'
import { HistoryIcon } from 'lucide-react'
import ContentNoteDialogContent, {
  ContentNoteDialogDataRow,
} from '../content-note/content-note-dialog-content'

type Props = {
  noteId: string
  isDesktop: boolean | undefined
}

const additionalDataRows: ContentNoteDialogDataRow<DetailedMovieNote>[] = [
  {
    icon: HistoryIcon,
    key: 'watchedAt',
    getLabel: () => 'Watched',
    getValue: (contentNote) =>
      contentNote?.watchedAt
        ? new Date(contentNote?.watchedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'N/A',
  },
]

export default function MovieNoteDialogContent({ noteId, isDesktop }: Props) {
  return (
    <ContentNoteDialogContent
      noteId={noteId}
      category="movies"
      additionalDataRows={additionalDataRows}
      isDesktop={isDesktop}
    />
  )
}
