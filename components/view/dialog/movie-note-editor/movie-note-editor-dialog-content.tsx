'use client'

import { FormField } from '@/components/ui/form'
import { DetailedMovieNote } from '@/lib/model/content-note'
import { movieNoteStatusLabels } from '@/utils/api/constants'
import { CreateMovieNoteReq } from '@/utils/api/request'
import { HistoryIcon } from 'lucide-react'
import { z } from 'zod'
import ContentNoteEditorDialogContent, {
  EditContentNoteBaseFormValues,
} from '../content-note-editor/content-note-editor-dialog-content'
import DayPickerFormItem from '../content-note-editor/day-picker-form-item'

type Props = {
  noteId: string
  isDesktop: boolean | undefined
}

type EditMovieNoteFormValues = EditContentNoteBaseFormValues & {
  watchedAt?: Date
}

export default function MovieNoteEditorDialogContent({
  noteId,
  isDesktop,
}: Props) {
  return (
    <ContentNoteEditorDialogContent<
      EditMovieNoteFormValues,
      DetailedMovieNote,
      Partial<CreateMovieNoteReq>
    >
      isDesktop={isDesktop}
      category="movies"
      contentNoteId={noteId}
      formExtension={{
        watchedAt: z.date().optional(),
      }}
      statusOptions={movieNoteStatusLabels}
      mapToReq={(values) => values}
      getAdditionalFormFields={(form) => (
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
      )}
    />
  )
}
