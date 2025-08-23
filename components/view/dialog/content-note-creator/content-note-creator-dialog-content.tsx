'use client'

import { Button } from '@/components/ui/button'
import ContentNotePoster from '@/components/ui/content-note/content-note-poster'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Form, FormField } from '@/components/ui/form'
import IGDBIcon from '@/components/ui/icons/igdb-icon'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  createContentNote,
  fetchContentById,
} from '@/hooks/api-endpoints-client'
import { toast } from '@/hooks/use-toast'
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
import { useMediaQuery } from '@/lib/use-media-query'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { gameNoteStatusLabels } from '@/utils/api/constants'
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

export type CreateContentNoteBaseFormValues = z.infer<typeof baseFormSchema>

type Props<
  V extends CreateContentNoteBaseFormValues,
  R extends CreateContentNoteReq,
> = {
  category: ContentCategory
  contentId: string
  formExtension?: object
  getAdditionalFormFields?: (form: UseFormReturn<V>) => React.ReactNode
  mapToReq: (values: V) => R
}

export default function ContentNoteCreatorDialogContent<
  V extends CreateContentNoteBaseFormValues,
  T extends DetailedContentNote,
  R extends CreateContentNoteReq,
>({
  category,
  contentId,
  formExtension,
  getAdditionalFormFields = () => null,
  mapToReq = (values) => values as unknown as R,
}: Props<V, R>) {
  const closeModal = useModalStore((state) => state.closeModal)
  const profile = useProfileStore((state) => state.profile)

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const [content, setContent] = React.useState<DetailedGame | DetailedMovie>()
  const [isLoading, startTransition] = React.useTransition()

  const formSchema = baseFormSchema.extend(formExtension ?? {})

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'planned',
      comment: '',
      rate: undefined,
      contentId,
    },
  })

  React.useEffect(() => {
    form.reset()
  }, [content?.id])

  React.useEffect(() => {
    if (!contentId || !profile?.id) return
    fetchContentById(category, contentId, 'lg')
      .then(setContent)
      .catch((err) => {
        toast({
          title: `Failed to fetch the content`,
          description: err instanceof Error ? err.message : 'Try again later.',
          variant: 'destructive',
        })
      })
  }, [contentId, profile?.id])

  const onSubmit = form.handleSubmit((values) => {
    if (!profile?.id) return

    startTransition(async () => {
      try {
        const req = mapToReq(values as V)
        await createContentNote<T, R>(profile, category, req)
        toast({
          title: content?.title ?? 'Untitled content',
          description: 'The content note was created.',
        })
        closeModal()
      } catch (error) {
        toast({
          title: 'Failed to create content note',
          description:
            error instanceof Error ? error.message : 'An error occurred.',
          variant: 'destructive',
        })
      }
    })
  })

  const Header = isDesktop ? DialogHeader : DrawerHeader
  const HeaderTitle = isDesktop ? DialogTitle : DrawerTitle
  const HeaderDescription = isDesktop ? DialogDescription : DrawerDescription
  const Footer = isDesktop ? DialogFooter : DrawerFooter

  const SourceIcon =
    content?.sourceType?.toLowerCase() === 'igdb' ? (
      <IGDBIcon className="w-12" />
    ) : (
      <SiThemoviedatabase className="size-7" color={SiThemoviedatabaseHex} />
    )

  return (
    <>
      <Header>
        <HeaderTitle>
          {content?.title}
          {content?.releaseDate && (
            <span className="text-sm text-muted-foreground">
              &nbsp; (
              {new Date(content.releaseDate).toLocaleDateString(undefined, {
                year: 'numeric',
              })}
              )
            </span>
          )}
        </HeaderTitle>
        <HeaderDescription>
          Fill your thoughts about this&nbsp;
          {localizeContentCategory(category).toLocaleLowerCase()}.
        </HeaderDescription>
      </Header>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-6 px-4 lg:px-0">
            <div className="flex items-start space-x-4">
              <ContentNotePoster
                posterUrl={content?.coverUrl}
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
                          options={gameNoteStatusLabels}
                        />
                      )}
                    />
                  </div>
                  {getAdditionalFormFields(form as unknown as UseFormReturn<V>)}
                </div>
                <div className="mb-1 mt-auto flex items-center gap-3">
                  {content?.sourceUrl && (
                    <Link href={content?.sourceUrl} target="_blank">
                      {SourceIcon}
                    </Link>
                  )}
                  {content?.websites && getContentSourceLinks(content.websites)}
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
          <Footer className="mt-4">
            {isDesktop && (
              <Button variant="destructive" type="button" onClick={closeModal}>
                <X />
                Cancel
              </Button>
            )}
            {contentId && (
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
              Add to my profile
            </Button>
          </Footer>
        </form>
      </Form>
    </>
  )
}
