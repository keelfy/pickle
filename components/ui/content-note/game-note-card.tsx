'use client'

import ContentNoteCard, {
  ContentNoteCardHeaderDataTableColumnGroup,
} from '@/components/ui/content-note/content-note-card'
import ContentNoteRequester from '@/components/ui/content-note/content-note-requester'
import { localizeContentNoteStatus } from '@/lib/localize-types'
import { DetailedContentNote, DetailedGameNote } from '@/lib/model/content-note'
import { ContentNoteReaction } from '@/lib/model/note-reaction'
import { useProfileStore } from '@/providers/profile-store'
import { History, UserPlus2 } from 'lucide-react'
import { ContentNoteStatusIcon } from './content-note-status-icon'

type Props = {
  note: DetailedGameNote
  defaultReactions?: ContentNoteReaction[]
}

export default function GameNoteCard({ note, defaultReactions }: Props) {
  const profile = useProfileStore((state) => state.profile)

  const columnGroups: ContentNoteCardHeaderDataTableColumnGroup<DetailedContentNote>[] =
    [
      {
        columns: [
          {
            icon: <History className="h-4 w-4 text-muted-foreground" />,
            label: 'Since',
            value: (note) =>
              new Date(note.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              }),
            showOnMobile: false,
          },
          {
            icon: <UserPlus2 className="h-4 w-4 text-muted-foreground" />,
            label:
              note.initialOrderer?.userId !== profile?.id
                ? 'Requester'
                : 'Added by',
            value: (note) => (
              <ContentNoteRequester
                orderer={note.initialOrderer}
                ordererCount={note.ordererCount}
              />
            ),
            showOnMobile: false,
          },
          {
            icon: null,
            label: 'Status',
            value: (note) => (
              <div className="flex flex-nowrap items-center gap-1">
                <ContentNoteStatusIcon
                  status={note.status}
                  className="size-4"
                />
                {localizeContentNoteStatus(note.status)}
              </div>
            ),
            showOnMobile: true,
          },
        ],
      },
    ]

  return (
    <ContentNoteCard
      note={note}
      category="games"
      columnGroups={columnGroups}
      releaseYear={
        note.content?.releaseDate
          ? new Date(note.content.releaseDate).getFullYear()
          : undefined
      }
      defaultReactions={defaultReactions}
    />
  )
}
