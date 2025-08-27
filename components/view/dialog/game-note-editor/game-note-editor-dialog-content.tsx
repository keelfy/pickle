'use client'

import { FormField } from '@/components/ui/form'
import { DetailedGameNote } from '@/lib/model/content-note'
import { gameNoteStatusLabels } from '@/utils/api/constants'
import { CreateGameNoteReq } from '@/utils/api/request'
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

type EditGameNoteFormValues = EditContentNoteBaseFormValues & {
  lastPlayedAt?: Date
}

export default function GameNoteEditorDialogContent({
  noteId,
  isDesktop,
}: Props) {
  return (
    <ContentNoteEditorDialogContent<
      EditGameNoteFormValues,
      DetailedGameNote,
      Partial<CreateGameNoteReq>
    >
      isDesktop={isDesktop}
      category="games"
      contentNoteId={noteId}
      formExtension={{
        lastPlayedAt: z.date().optional(),
      }}
      statusOptions={gameNoteStatusLabels}
      mapToReq={(values) => values}
      getAdditionalFormFields={(form) => (
        <>
          <div className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
            <HistoryIcon className="size-3" />
            Last played
          </div>
          <div>
            <FormField
              control={form.control}
              name="lastPlayedAt"
              render={({ field }) => <DayPickerFormItem field={field} />}
            />
          </div>
        </>
      )}
    />
  )
}
