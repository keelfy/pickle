'use client'

import { DetailedGameNote } from '@/lib/model/content-note'
import { HistoryIcon } from 'lucide-react'
import ContentNoteDialogContent, {
  ContentNoteDialogDataRow,
} from '../content-note/content-note-dialog-content'

type Props = {
  noteId: string
  isDesktop: boolean | undefined
}

const additionalDataRows: ContentNoteDialogDataRow<DetailedGameNote>[] = [
  {
    icon: HistoryIcon,
    key: 'lastPlayedAt',
    getLabel: () => 'Last played',
    getValue: (contentNote) =>
      contentNote?.lastPlayedAt
        ? new Date(contentNote?.lastPlayedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'N/A',
  },
]

export default function GameNoteDialogContent({ noteId, isDesktop }: Props) {
  return (
    <ContentNoteDialogContent
      noteId={noteId}
      category="games"
      additionalDataRows={additionalDataRows}
      isDesktop={isDesktop}
    />
  )
}
