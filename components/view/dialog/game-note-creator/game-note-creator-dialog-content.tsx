'use client'

import { FormField } from '@/components/ui/form'
import { DetailedGameNote } from '@/lib/model/content-note'
import { gameNoteStatusLabels } from '@/utils/api/constants'
import { CreateGameNoteReq } from '@/utils/api/request'
import { HistoryIcon } from 'lucide-react'
import { z } from 'zod'
import ContentNoteFormDialogContent from '../content-note-form/content-note-form-dialog-content'
import DayPickerFormItem from '../content-note-editor/day-picker-form-item'

type Props = {
  contentId: string
  isDesktop: boolean | undefined
}

const gameCreatorSchema = z.object({
  status: z.custom<DetailedGameNote['status']>(),
  comment: z.string().optional(),
  rate: z.number().max(10).min(1).optional(),
  contentId: z.string(),
  lastPlayedAt: z.date().optional(),
  watchedAt: z.date().optional(),
})

export default function GameNoteCreatorDialogContent({
  contentId,
  isDesktop,
}: Props) {
  return (
    <ContentNoteFormDialogContent<DetailedGameNote, CreateGameNoteReq>
      mode="create"
      isDesktop={isDesktop}
      category="games"
      contentId={contentId}
      statusOptions={gameNoteStatusLabels}
      config={{
        schema: gameCreatorSchema,
        defaultValues: ({ contentId: currentContentId }) => ({
          status: 'planned',
          comment: '',
          rate: undefined,
          contentId: currentContentId ?? '',
          lastPlayedAt: undefined,
          watchedAt: undefined,
        }),
        toRequest: (values) => values,
        renderAdditionalFields: (form) => (
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
        ),
      }}
    />
  )
}
