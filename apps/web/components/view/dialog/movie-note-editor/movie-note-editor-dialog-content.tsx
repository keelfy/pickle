'use client'

import { FormField } from '@/components/ui/form'
import { DetailedMovieNote } from '@/lib/model/content-note'
import { movieNoteStatusLabels } from '@/utils/api/constants'
import { CreateMovieNoteReq } from '@/utils/api/request'
import { HistoryIcon } from 'lucide-react'
import { z } from 'zod'
import ContentNoteFormDialogContent from '../content-note-form/content-note-form-dialog-content'
import DayPickerFormItem from '../content-note-editor/day-picker-form-item'

type Props = {
  noteId: string
  isDesktop: boolean | undefined
}

const movieEditorSchema = z.object({
  status: z.custom<DetailedMovieNote['status']>(),
  comment: z.string().optional(),
  rate: z.number().max(10).min(1).optional(),
  contentId: z.string(),
  watchedAt: z.date().optional(),
  lastPlayedAt: z.date().optional(),
})

export default function MovieNoteEditorDialogContent({
  noteId,
  isDesktop,
}: Props) {
  return (
    <ContentNoteFormDialogContent<DetailedMovieNote, Partial<CreateMovieNoteReq>>
      mode="edit"
      isDesktop={isDesktop}
      category="movies"
      noteId={noteId}
      statusOptions={movieNoteStatusLabels}
      config={{
        schema: movieEditorSchema,
        defaultValues: ({ contentNote }) => ({
          status: contentNote?.status ?? 'planned',
          comment: contentNote?.comment ?? '',
          rate: contentNote?.rate ?? undefined,
          contentId: contentNote?.content?.id ?? '',
          watchedAt: contentNote?.watchedAt
            ? new Date(contentNote.watchedAt)
            : undefined,
          lastPlayedAt: undefined,
        }),
        toRequest: (values) => values,
        renderAdditionalFields: (form) => (
          <>
            <div className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
              <HistoryIcon className="size-3" />
              Watched at
            </div>
            <div>
              <FormField
                control={form.control}
                name="watchedAt"
                render={({ field }) => <DayPickerFormItem field={field} />}
              />
            </div>
          </>
        ),
      }}
    />
  )
}
