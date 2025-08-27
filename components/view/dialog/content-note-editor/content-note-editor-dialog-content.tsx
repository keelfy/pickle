'use client'

import { Button } from '@/components/ui/button'
import ContentNotePoster from '@/components/ui/content-note/content-note-poster'
import {
  DialogWrapperDescription,
  DialogWrapperFooter,
  DialogWrapperHeader,
  DialogWrapperTitle,
} from '@/components/ui/dialog-wrapper'
import { Form, FormField } from '@/components/ui/form'
import IGDBIcon from '@/components/ui/icons/igdb-icon'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  fetchContentNote,
  updateContentNote,
} from '@/hooks/api-endpoints-client'
import { localizeContentCategory } from '@/lib/localize-types'
import {
  ContentCategory,
  DetailedGame,
  DetailedMovie,
} from '@/lib/model/content'
import {
  ContentNoteStatus,
  DetailedContentNote,
} from '@/lib/model/content-note'
import { toastError } from '@/lib/toasts'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { ApiType } from '@/utils/api/constants'
import { CreateContentNoteReq } from '@/utils/api/request'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  SiThemoviedatabase,
  SiThemoviedatabaseHex,
} from '@icons-pack/react-simple-icons'
import { Check, CheckIcon, CircleOff, X } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import CommentFormItem from './comment-form-item'
import getContentSourceLinks from './get-content-source-links'
import RateFormItem from './rate-form-item'
import StatusSelectFormItem from './status-select-form-item'

const baseFormSchema = z.object({
  contentId: z.string(),
  status: z.custom<ContentNoteStatus>(),
  comment: z.string().optional(),
  rate: z.number().max(10).min(1).optional(),
})

export type EditContentNoteBaseFormValues = z.infer<typeof baseFormSchema>

type Props<
  V extends EditContentNoteBaseFormValues,
  R extends Partial<CreateContentNoteReq>,
> = {
  category: ContentCategory
  contentNoteId: string
  formExtension?: object
  statusOptions: ApiType<ContentNoteStatus>[]
  getAdditionalFormFields?: (form: UseFormReturn<V>) => React.ReactNode
  getContentYears?: (content: DetailedGame | DetailedMovie) => string
  mapToReq: (values: V) => R
  isDesktop: boolean | undefined
}

export default function ContentNoteEditorDialogContent<
  V extends EditContentNoteBaseFormValues,
  T extends DetailedContentNote,
  R extends Partial<CreateContentNoteReq>,
>({
  category,
  contentNoteId,
  formExtension,
  statusOptions,
  getAdditionalFormFields = () => null,
  getContentYears = () => '',
  mapToReq = (values) => values as unknown as R,
  isDesktop,
}: Props<V, R>) {
  const closeModal = useModalStore((state) => state.closeModal)
  const profile = useProfileStore((state) => state.profile)

  const [contentNote, setContentNote] = React.useState<T>()

  const [isLoading, startTransition] = React.useTransition()

  const formSchema = baseFormSchema.extend(formExtension ?? {})

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: (contentNote?.status as ContentNoteStatus) ?? 'planned',
      comment: contentNote?.comment ?? '',
      rate: contentNote?.rate ?? undefined,
      contentId: contentNote?.content?.id,
    },
  })

  React.useEffect(() => {
    form.reset({
      status: (contentNote?.status as ContentNoteStatus) ?? 'planned',
      comment: contentNote?.comment ?? '',
      rate: contentNote?.rate ?? undefined,
      contentId: contentNote?.content?.id,
    })
  }, [contentNote?.id])

  React.useEffect(() => {
    if (!contentNoteId || !profile?.id) return
    fetchContentNote<T>(profile, category, contentNoteId, 'lg')
      .then(setContentNote)
      .catch((err) => {
        toastError(`Failed to fetch the content note`, err)
      })
  }, [contentNoteId, profile?.id])

  const onSubmit = form.handleSubmit((values) => {
    if (!profile?.id) return

    startTransition(async () => {
      try {
        const req = mapToReq(values as V)
        await updateContentNote<T, R>(profile, category, contentNoteId, req)
        toast.success(contentNote?.content?.title ?? 'Untitled content', {
          description: 'The content note was updated.',
        })
        closeModal()
      } catch (error) {
        toastError('Failed to update content note', error)
      }
    })
  })

  const SourceIcon =
    contentNote?.content?.sourceType?.toLowerCase() === 'igdb' ? (
      <IGDBIcon className="w-12" />
    ) : (
      <SiThemoviedatabase className="size-7" color={SiThemoviedatabaseHex} />
    )

  return (
    <>
      <DialogWrapperHeader isDesktop={isDesktop}>
        <DialogWrapperTitle isDesktop={isDesktop}>
          {contentNote?.content?.title}
          {contentNote?.content && getContentYears(contentNote.content)}
        </DialogWrapperTitle>
        <DialogWrapperDescription isDesktop={isDesktop}>
          Fill your thoughts about this&nbsp;
          {localizeContentCategory(category).toLocaleLowerCase()}.
        </DialogWrapperDescription>
      </DialogWrapperHeader>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-6 px-4 lg:px-0">
            <div className="flex items-start space-x-4">
              <ContentNotePoster
                posterUrl={contentNote?.content?.coverUrl}
                size={isDesktop ? 'md' : 'sm'}
                loading={isLoading}
              />
              <div className="flex min-h-[144px] w-full flex-col lg:min-h-[225px]">
                <div className="flex-0 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
                    <CheckIcon size={12} />
                    Status
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <StatusSelectFormItem
                          field={field}
                          options={statusOptions}
                        />
                      )}
                    />
                  </div>
                  {getAdditionalFormFields(form as unknown as UseFormReturn<V>)}
                </div>
                <div className="mb-1 mt-auto flex items-center gap-3">
                  {contentNote?.content?.sourceUrl && (
                    <Link href={contentNote.content.sourceUrl} target="_blank">
                      {SourceIcon}
                    </Link>
                  )}
                  {contentNote?.content?.websites &&
                    getContentSourceLinks(contentNote.content.websites)}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => <RateFormItem field={field} />}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => <CommentFormItem field={field} />}
            />

            <div className="hidden space-y-2">
              <Label className="text-md font-semibold">
                Recordings/Highlights
              </Label>
              <ScrollArea className="max-w-[29rem] whitespace-nowrap">
                <div className="flex space-x-2 pb-4">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[108px] w-[192px] rounded-sm bg-white"
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
          <DialogWrapperFooter isDesktop={isDesktop} className="mt-4">
            {isDesktop && (
              <Button variant="destructive" type="button" onClick={closeModal}>
                <X />
                Cancel
              </Button>
            )}
            {contentNoteId && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => form.reset()}
                disabled={isLoading || !form.formState.isDirty}
              >
                <CircleOff />
                Reset
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : <Check />}
              Confirm changes
            </Button>
          </DialogWrapperFooter>
        </form>
      </Form>
    </>
  )
}
