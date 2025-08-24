'use client'

import { Button } from '@/components/ui/button'
import ContentNotePoster from '@/components/ui/content-note/content-note-poster'
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormField } from '@/components/ui/form'
import IGDBIcon from '@/components/ui/icons/igdb-icon'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  fetchContentNote,
  updateContentNote,
} from '@/hooks/api-endpoints-client'
import { toast } from '@/hooks/use-toast'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import {
  gameNoteStatusLabels,
  movieNoteStatusLabels,
} from '@/utils/api/constants'
import { DetailedMovieNote, MovieNoteStatus } from '@/lib/model/content-note'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Check,
  CheckIcon,
  CircleOff,
  HistoryIcon,
  RocketIcon,
  X,
} from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import CommentFormItem from '../content-note-editor/comment-form-item'
import DayPickerFormItem from '../content-note-editor/day-picker-form-item'
import RateFormItem from '../content-note-editor/rate-form-item'
import StatusSelectFormItem from '../content-note-editor/status-select-form-item'
import { ContentNoteDialogOrdersSection } from '../content-note/content-note-dialog-orders-section'
import Link from 'next/link'
import { CreateMovieNoteReq } from '@/utils/api/request'
import getContentSourceLinks from '../content-note-editor/get-content-source-links'

const formSchema = z.object({
  status: z.custom<MovieNoteStatus>(),
  watchedAt: z.date().optional(),
  comment: z.string().optional(),
  rate: z.number().max(10).min(1).optional(),
})

type Props = { noteId: string | undefined }

export default function MovieNoteEditorDialogContent({ noteId }: Props) {
  const closeModal = useModalStore((state) => state.closeModal)
  const profile = useProfileStore((state) => state.profile)

  const [movieNote, setMovieNote] = React.useState<DetailedMovieNote>()
  const [isLoading, startTransition] = React.useTransition()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'planned',
      comment: '',
    },
  })

  const resetForm = (movieNote: DetailedMovieNote) =>
    form.reset({
      status: movieNote.status as MovieNoteStatus,
      watchedAt: movieNote.watchedAt
        ? new Date(movieNote.watchedAt)
        : undefined,
      comment: movieNote.comment,
      rate: movieNote.rate,
    })

  React.useEffect(() => {
    if (movieNote) {
      resetForm(movieNote)
    } else {
      form.reset()
    }
  }, [movieNote?.id])

  React.useEffect(() => {
    if (!noteId || !profile?.id) return
    fetchContentNote<DetailedMovieNote>(profile, 'movies', noteId, 'lg')
      .then(setMovieNote)
      .catch((err) => {
        console.error(err)
        toast({
          title: 'Failed to fetch movie note',
          description: 'Try again later.',
        })
      })
  }, [noteId, profile?.id])

  const onSubmit = form.handleSubmit((values) => {
    if (!profile?.id || !noteId) return

    startTransition(async () => {
      try {
        const res = await updateContentNote<
          DetailedMovieNote,
          Partial<CreateMovieNoteReq>
        >(profile, 'movies', noteId, values)
        resetForm(res)
      } catch (error) {
        toast({
          title: 'Failed to update movie',
          description:
            error instanceof Error ? error.message : 'An error occurred.',
          variant: 'destructive',
        })
      }
    })
  })

  return (
    <>
      <div className="hidden">
        <DialogHeader>
          <DialogTitle>{movieNote?.content?.title}</DialogTitle>
        </DialogHeader>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <ContentNotePoster
                posterUrl={movieNote?.content?.coverUrl}
                size="md"
                loading={isLoading}
              />
              <div className="grid min-h-[225px] w-full">
                <div className="flex flex-col gap-0">
                  <div className="line-clamp-3 text-lg font-bold">
                    {movieNote?.content?.title}
                  </div>
                  {movieNote?.content?.releaseDate && (
                    <div className="flex items-center gap-1 whitespace-nowrap text-sm">
                      <RocketIcon className="size-3" />
                      {new Date(
                        movieNote?.content?.releaseDate,
                      ).toLocaleDateString(undefined, {
                        year: 'numeric',
                      })}
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2">
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
                            options={movieNoteStatusLabels}
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
                      <HistoryIcon size={12} />
                      Watched at
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="watchedAt"
                        render={({ field }) => (
                          <DayPickerFormItem field={field} />
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-1 mt-auto flex items-center gap-3">
                  {movieNote?.content?.sourceUrl && (
                    <Link href={movieNote?.content?.sourceUrl} target="_blank">
                      <IGDBIcon className="w-12" />
                    </Link>
                  )}
                  {movieNote?.content?.websites &&
                    getContentSourceLinks(movieNote.content?.websites)}
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

            {noteId && (
              <ContentNoteDialogOrdersSection
                contentNote={movieNote}
                category="movies"
              />
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="destructive" type="button" onClick={closeModal}>
              <X />
              Cancel
            </Button>
            {noteId && (
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
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isDirty}
            >
              {isLoading ? <LoadingSpinner /> : <Check />}
              {noteId ? 'Confirm' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
