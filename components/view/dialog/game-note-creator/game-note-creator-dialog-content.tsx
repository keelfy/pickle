'use client'

import { FormField } from '@/components/ui/form'
import { DetailedGameNote } from '@/lib/model/content-note'
import { gameNoteStatusLabels } from '@/utils/api/constants'
import { CreateGameNoteReq } from '@/utils/api/request'
import { HistoryIcon } from 'lucide-react'
import { z } from 'zod'
import ContentNoteCreatorDialogContent, {
  CreateContentNoteBaseFormValues,
} from '../content-note-creator/content-note-creator-dialog-content'
import DayPickerFormItem from '../content-note-editor/day-picker-form-item'

type Props = {
  contentId: string
  isDesktop: boolean | undefined
}

type CreateGameNoteFormValues = CreateContentNoteBaseFormValues & {
  lastPlayedAt?: Date
}

export default function GameNoteCreatorDialogContent({
  contentId,
  isDesktop,
}: Props) {
  return (
    <ContentNoteCreatorDialogContent<
      CreateGameNoteFormValues,
      DetailedGameNote,
      CreateGameNoteReq
    >
      isDesktop={isDesktop}
      category="games"
      contentId={contentId}
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
