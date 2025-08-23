import ContentNoteCardComment from '@/components/ui/content-note/content-note-card-comment'
import ContentNoteReactions from '@/components/ui/content-note/content-note-reactions'
import { Label } from '@/components/ui/label'
import { ContentCategory } from '@/lib/model/content'
import { DetailedContentNote } from '@/lib/model/content-note'
import { ContentNoteReaction } from '@/lib/model/note-reaction'
import { MessageCircleIcon } from 'lucide-react'

type Props = {
  contentNote: DetailedContentNote | undefined
  category: ContentCategory
  defaultReactions: ContentNoteReaction[] | undefined
}

export default function ContentNoteDialogReview({
  contentNote,
  category,
  defaultReactions,
}: Props) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-2">
        <MessageCircleIcon className="h-4 w-4" />
        <Label className="text-md font-semibold">Review</Label>
      </div>
      <ContentNoteCardComment
        comment={contentNote?.comment}
        className="rounded-lg"
        lengthLimit={180}
      />
      {/* {contentNote && defaultReactions && (
        <ContentNoteReactions
          contentNote={contentNote}
          category={category}
          defaultReactions={defaultReactions}
          className="mt-2"
        />
      )} */}
    </div>
  )
}
