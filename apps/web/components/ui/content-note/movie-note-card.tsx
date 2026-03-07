import ContentNoteCard, {
  ContentNoteCardHeaderDataTableColumnGroup,
} from '@/components/ui/content-note/content-note-card'
import { useProfileStore } from '@/providers/profile-store'
import {
  DetailedContentNote,
  DetailedMovieNote,
} from '@/lib/model/content-note'
import { ContentNoteReaction } from '@/lib/model/note-reaction'
import { CheckCheckIcon, History, UserPlus2 } from 'lucide-react'
import ContentNoteRequester from '@/components/ui/content-note/content-note-requester'
import { ContentNoteStatusIcon } from './content-note-status-icon'

type Props = {
  note: DetailedMovieNote
  defaultReactions?: ContentNoteReaction[]
}

export default function MovieNoteCard({ note, defaultReactions }: Props) {
  const profile = useProfileStore((state) => state.profile)

  const columnGroups: ContentNoteCardHeaderDataTableColumnGroup<DetailedContentNote>[] =
    [
      {
        columns: [
          {
            icon: <History size={12} />,
            label: 'Since',
            value: (note) =>
              new Date(note.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
            showOnMobile: false,
          },
          {
            icon: <UserPlus2 size={12} />,
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
            icon: <CheckCheckIcon className="h-4 w-4 text-muted-foreground" />,
            label: 'Status',
            value: (note) => (
              <ContentNoteStatusIcon status={note.status} className="size-6" />
            ),
            showOnMobile: true,
          },
        ],
      },
    ]

  return (
    <ContentNoteCard
      note={note}
      category="movies"
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
