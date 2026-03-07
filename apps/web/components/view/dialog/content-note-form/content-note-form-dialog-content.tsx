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
  useCreateContentNoteMutation,
  useUpdateContentNoteMutation,
} from '@/hooks/mutations/use-content-note-mutations'
import { useContentDetail } from '@/hooks/queries/use-content-detail'
import { useContentNote } from '@/hooks/queries/use-content-note'
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
import CommentFormItem from '../content-note-editor/comment-form-item'
import getContentSourceLinks from '../content-note-editor/get-content-source-links'
import RateFormItem from '../content-note-editor/rate-form-item'
import StatusSelectFormItem from '../content-note-editor/status-select-form-item'

const baseFormSchema = z.object({
  status: z.custom<ContentNoteStatus>(),
  comment: z.string().optional(),
  rate: z.number().max(10).min(1).optional(),
  contentId: z.string(),
})

export type ContentNoteBaseFormValues = z.infer<typeof baseFormSchema>
export type ContentNoteFormMode = 'create' | 'edit'
export type ContentNoteFormValues = ContentNoteBaseFormValues & {
  watchedAt?: Date
  lastPlayedAt?: Date
}

type DefaultValuesContext<T extends DetailedContentNote> = {
  mode: ContentNoteFormMode
  contentId?: string
  contentNote?: T
  content?: DetailedGame | DetailedMovie
}

type ContentNoteFormConfig<
  T extends DetailedContentNote,
  R extends Partial<CreateContentNoteReq>,
> = {
  schema: z.ZodTypeAny
  defaultValues: (ctx: DefaultValuesContext<T>) => ContentNoteFormValues
  toRequest: (values: ContentNoteFormValues) => R
  renderAdditionalFields?: (
    form: UseFormReturn<ContentNoteFormValues>,
  ) => React.ReactNode
}

type Props<
  T extends DetailedContentNote,
  R extends Partial<CreateContentNoteReq>,
> = {
  mode: ContentNoteFormMode
  category: ContentCategory
  contentId?: string
  noteId?: string
  statusOptions: ApiType<ContentNoteStatus>[]
  config: ContentNoteFormConfig<T, R>
  isDesktop: boolean | undefined
}

export default function ContentNoteFormDialogContent<
  T extends DetailedContentNote,
  R extends Partial<CreateContentNoteReq>,
>({
  mode,
  category,
  contentId,
  noteId,
  statusOptions,
  config,
  isDesktop,
}: Props<T, R>) {
  const closeModal = useModalStore((state) => state.closeModal)
  const profile = useProfileStore((state) => state.profile)
  const [isLoading, startTransition] = React.useTransition()
  const createMutation = useCreateContentNoteMutation<T, CreateContentNoteReq>()
  const updateMutation = useUpdateContentNoteMutation<T, R>()

  const {
    data: content,
    error: contentError,
    isPending: isContentPending,
  } = useContentDetail({
    category,
    contentId: contentId ?? '',
    coverSize: 'lg',
  })
  const {
    data: contentNote,
    error: contentNoteError,
    isPending: isContentNotePending,
  } = useContentNote<T>({
    user: profile ?? undefined,
    category,
    noteId: noteId ?? '',
    coverSize: 'lg',
  })

  const currentContent = mode === 'edit' ? contentNote?.content : content
  const isDataPending = mode === 'edit' ? isContentNotePending : isContentPending
  const isSubmitDisabled =
    isLoading || isDataPending || (mode === 'edit' && !contentNote)
  const formDefaultValues = React.useMemo(
    () =>
      config.defaultValues({
        mode,
        contentId,
        contentNote,
        content,
      }),
    [config, content, contentId, contentNote, mode],
  )

  const form = useForm<ContentNoteFormValues>({
    resolver: zodResolver(config.schema as never),
    defaultValues: formDefaultValues,
  })

  React.useEffect(() => {
    form.reset(formDefaultValues)
  }, [form, formDefaultValues])

  React.useEffect(() => {
    if (mode === 'edit' && contentNoteError) {
      toastError('Failed to fetch the content note', contentNoteError)
      return
    }
    if (mode === 'create' && contentError) {
      toastError('Failed to fetch the content', contentError)
    }
  }, [contentError, contentNoteError, mode])

  const onSubmit = form.handleSubmit((values) => {
    if (!profile?.id) return
    if (mode === 'edit' && !contentNote) return

    startTransition(async () => {
      try {
        const request = config.toRequest(values)
        if (mode === 'edit') {
          if (!noteId) return
          await updateMutation.mutateAsync({
            user: profile,
            category,
            noteId,
            note: request,
          })
          toast.success(currentContent?.title ?? 'Untitled content', {
            description: 'The content note was updated.',
          })
        } else {
          await createMutation.mutateAsync({
            user: profile,
            category,
            note: request as CreateContentNoteReq,
          })
          toast.success(currentContent?.title ?? 'Untitled content', {
            description: 'The content note was created.',
          })
        }
        closeModal()
      } catch (error) {
        toastError(
          mode === 'edit'
            ? 'Failed to update content note'
            : 'Failed to create content note',
          error,
        )
      }
    })
  })

  const SourceIcon =
    currentContent?.sourceType?.toLowerCase() === 'igdb' ? (
      <IGDBIcon className="w-12" />
    ) : (
      <SiThemoviedatabase className="size-7" color={SiThemoviedatabaseHex} />
    )

  return (
    <>
      <DialogWrapperHeader isDesktop={isDesktop}>
        <DialogWrapperTitle isDesktop={isDesktop}>
          {currentContent?.title ?? (isDataPending ? 'Loading...' : undefined)}
          {mode === 'create' && content?.releaseDate && (
            <span className="text-sm text-muted-foreground">
              &nbsp;(
              {new Date(content.releaseDate).toLocaleDateString(undefined, {
                year: 'numeric',
              })}
              )
            </span>
          )}
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
                posterUrl={currentContent?.coverUrl}
                size={isDesktop ? 'md' : 'sm'}
                loading={isLoading || isDataPending}
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
                  {config.renderAdditionalFields?.(form)}
                </div>
                <div className="mb-1 mt-auto flex items-center gap-3">
                  {currentContent?.sourceUrl && (
                    <Link href={currentContent.sourceUrl} target="_blank">
                      {SourceIcon}
                    </Link>
                  )}
                  {currentContent?.websites &&
                    getContentSourceLinks(currentContent.websites)}
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
            <Button
              variant="secondary"
              type="button"
              onClick={() => form.reset()}
              disabled={isSubmitDisabled || !form.formState.isDirty}
            >
              <CircleOff />
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitDisabled ? <LoadingSpinner /> : <Check />}
              {mode === 'edit' ? 'Confirm changes' : 'Add to my profile'}
            </Button>
          </DialogWrapperFooter>
        </form>
      </Form>
    </>
  )
}
