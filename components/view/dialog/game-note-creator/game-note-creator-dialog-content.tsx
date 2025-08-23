'use client'

import { DetailedGameNote } from '@/lib/model/content-note'
import { CreateGameNoteReq } from '@/utils/api/request'
import { z } from 'zod'
import ContentNoteCreatorDialogContent, {
  CreateContentNoteBaseFormValues,
} from '../content-note-creator/content-note-creator-dialog-content'
import { HistoryIcon } from 'lucide-react'
import { FormField } from '@/components/ui/form'
import DayPickerFormItem from '../content-note-editor/day-picker-form-item'

type Props = {
  contentId: string
}

type CreateGameNoteFormValues = CreateContentNoteBaseFormValues & {
  lastPlayedAt?: Date
}

export default function GameNoteCreatorDialogContent({ contentId }: Props) {
  return (
    <ContentNoteCreatorDialogContent<
      CreateGameNoteFormValues,
      DetailedGameNote,
      CreateGameNoteReq
    >
      category="games"
      contentId={contentId}
      formExtension={{
        lastPlayedAt: z.date().optional(),
      }}
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
