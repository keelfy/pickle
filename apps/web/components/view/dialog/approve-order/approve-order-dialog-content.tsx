'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useApproveOrderMutation,
  useOrderDetail,
} from '@/hooks/mutations/use-order-mutations'
import { useContentSearchInfinite } from '@/hooks/queries/use-content-search-infinite'
import { useDebounce } from '@/hooks/use-debounce'
import { toastError } from '@/lib/toasts'
import { localizeContentCategory } from '@/lib/localize-types'
import { Content, ContentCategory } from '@/lib/model/content'
import { DetailedOrder } from '@/lib/model/order'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { getModalParams, ModalType } from '@/stores/modal'
import { contentCategoryLabels } from '@/utils/api/constants'
import { Paginated } from '@/utils/api/response'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Check,
  CircleAlertIcon,
  CircleOff,
  FoldersIcon,
  ListPlusIcon,
  X,
} from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  category: z.custom<ContentCategory>(),
  content: z.object({
    id: z.uuidv4({
      error: 'Please select a content to link to the suggestion',
    }),
    title: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  }),
})

export default function ApproveOrderDialogContent() {
  const { closeModal, openModal } = useModalStore((state) => state)
  const rawModalParams = useModalStore((state) => state.modalParams)
  const modalParams = React.useMemo(
    () => getModalParams(ModalType.ApproveOrder, rawModalParams),
    [rawModalParams],
  )
  const { profile } = useProfileStore((state) => state)
  const { data: order, error: orderError } = useOrderDetail(
    profile ?? undefined,
    modalParams?.id,
  )
  const approveOrderMutation = useApproveOrderMutation()

  const [contentSearchQuery, setContentSearchQuery] = React.useState<string>('')
  const debouncedContentQuery = useDebounce(contentSearchQuery, 200)

  const [isOrderApproving, startOrderApprovingTransition] =
    React.useTransition()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: order?.category ?? 'games',
      content: {
        id: '',
      },
    },
  })

  const isSearchQueryValid = React.useMemo(
    () =>
      debouncedContentQuery &&
      debouncedContentQuery.length > 2 &&
      debouncedContentQuery.length <= 100,
    [debouncedContentQuery],
  )
  const category = form.watch('category')
  const {
    data: externalSearchPages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    error: contentSearchError,
  } = useContentSearchInfinite({
    category,
    query: debouncedContentQuery,
    size: 5,
    userId: profile?.id,
  })

  const externalSearchResults = React.useMemo((): Paginated<Content> | undefined => {
    if (!externalSearchPages?.pages?.length || !isSearchQueryValid) return undefined
    const lastPage = externalSearchPages.pages[externalSearchPages.pages.length - 1]
    return {
      ...lastPage,
      content: externalSearchPages.pages.flatMap((page) => page.content),
    }
  }, [externalSearchPages?.pages, isSearchQueryValid])

  React.useEffect(() => {
    if (contentSearchError) {
      toastError('Failed to fetch search results', contentSearchError)
    }
  }, [contentSearchError])

  React.useEffect(() => {
    if (orderError) {
      toastError('Failed to fetch the order', orderError)
    }
  }, [orderError])

  React.useEffect(() => {
    onReset()
  }, [order?.id])

  const onReset = () => {
    if (order) {
      form.reset({
        category: order?.category ?? 'games',
      })
    } else {
      form.reset()
    }
  }

  const openContentNoteEditor = (
    category: ContentCategory,
    contentId: string,
  ) => {
    switch (category) {
      case 'games':
        openModal(ModalType.GameNoteEditor, {
          noteId: contentId,
        })
        break
      case 'movies':
        openModal(ModalType.MovieNoteEditor, {
          noteId: contentId,
        })
        break
      default:
        break
    }
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!modalParams?.id || !profile) {
      closeModal()
      return
    }

    startOrderApprovingTransition(async () => {
      try {
        const res = await approveOrderMutation.mutateAsync({
          user: profile,
          orderId: modalParams.id,
          order: {
          category: values.category,
          contentId: values.content?.id,
          },
        })

        // if (!res?.contentCreated) {
        //   closeModal()
        // } else
        if (res.decision?.contentNote) {
          openContentNoteEditor(values.category, res.decision.contentNote.id)
        }
      } catch (error) {
        toastError('Failed to approve the order', error)
      }
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Approve the suggestion</DialogTitle>
        <DialogDescription>
          After approving, the order will be added to existing content or a new
          content will be added to your profile.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <p className="rounded-md bg-muted-foreground/10 p-2 text-sm">
            {order?.createdAt && (
              <span className="font-mono text-xs text-muted-foreground">
                [{new Date(order.createdAt).toLocaleString()}]&nbsp;
              </span>
            )}
            <span className="font-bold">{order?.orderer?.displayName}</span>
            :&nbsp;
            <span className="italic">{order?.message ?? 'No message'}</span>
          </p>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FoldersIcon className="size-4" />
                  Category
                </FormLabel>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => {
                    if (value) {
                      form.setValue('category', value as ContentCategory)
                      form.setFocus('category')
                    }
                  }}
                  required
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {contentCategoryLabels.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormDescription>
                  What category is this suggestion about?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="flex items-center gap-2">
                    <ListPlusIcon className="size-4" />
                    {localizeContentCategory(form.watch('category'))}
                  </FormLabel>
                  <div className="flex items-center justify-between gap-2 rounded-md border px-4 py-1">
                    <div className="flex items-center gap-2">
                      {field.value.thumbnailUrl && (
                        <Image
                          src={field.value.thumbnailUrl}
                          alt={field.value.title ?? ''}
                          width={35}
                          height={35}
                          className="h-8 w-8 rounded-md p-1"
                          unoptimized
                        />
                      )}
                      {field.value.title ? (
                        <p className="text-sm">{field.value.title}</p>
                      ) : (
                        <>
                          <CircleAlertIcon className="size-4 text-yellow-500" />
                          <p className="text-sm italic">No content selected</p>
                        </>
                      )}
                    </div>
                    <FormControl>
                      <Button
                        variant="link"
                        size="icon"
                        type="button"
                        onClick={() => {
                          field.onChange({
                            id: '',
                            title: undefined,
                            thumbnailUrl: undefined,
                          })
                        }}
                      >
                        <X />
                      </Button>
                    </FormControl>
                  </div>
                  <FormDescription>
                    Please find the{' '}
                    {localizeContentCategory(
                      form.watch('category'),
                    ).toLowerCase()}{' '}
                    related to the suggestion.
                  </FormDescription>
                </FormItem>
              )}
            />
            <Command shouldFilter={false} className="rounded-md border">
              <CommandInput
                placeholder={`Type to search a ${localizeContentCategory(form.watch('category')).toLowerCase()}`}
                onValueChange={setContentSearchQuery}
                value={contentSearchQuery}
              />
              <CommandList>
                <CommandGroup>
                  {externalSearchResults?.content.map((content) => (
                    <CommandItem
                      key={content.id}
                      value={content.title}
                      onSelect={() => {
                        form.setValue('content', {
                          id: content.id,
                          title: content.title,
                          thumbnailUrl: content.coverUrl,
                        })
                        form.setFocus('content')
                      }}
                      className="flex items-center justify-start gap-1"
                    >
                      {content.coverUrl && (
                        <Image
                          src={content.coverUrl}
                          alt={content.title}
                          width={35}
                          height={35}
                          className="h-8 w-8 rounded-md p-1"
                          unoptimized
                        />
                      )}
                      {content.title}
                    </CommandItem>
                  ))}
                  {!externalSearchResults && (
                    <CommandItem className="italic" disabled>
                      ...type anything to search
                    </CommandItem>
                  )}
                  {externalSearchResults?.content &&
                    externalSearchResults.content.length === 0 && (
                      <CommandItem className="italic" disabled>
                        ...no results found
                      </CommandItem>
                    )}
                  {externalSearchResults?.content &&
                    externalSearchResults.content.length > 0 &&
                    hasNextPage && (
                      <CommandItem
                        onSelect={() => {
                          if (!isFetchingNextPage) {
                            void fetchNextPage()
                          }
                        }}
                      >
                        {isFetchingNextPage
                          ? '-- Loading more results --'
                          : '-- Show more results --'}
                      </CommandItem>
                    )}
                </CommandGroup>
              </CommandList>
            </Command>
            {/* {{!form.watch("content")?.id && ( */}
            {/* <div className="flex items-center gap-2 px-2">
                            <CircleAlert
                                size={16}
                                className="text-yellow-500"
                            />
                            <span className="text-sm">
                                A new title will be added to your profile.
                            </span>
                        </div> */}
            {/* )} */}
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={closeModal}
              disabled={isOrderApproving}
            >
              <X />
              Cancel
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={onReset}
              disabled={isOrderApproving}
            >
              <CircleOff />
              Reset
            </Button>
            <Button type="submit" disabled={isOrderApproving}>
              {isOrderApproving ? <LoadingSpinner /> : <Check />}
              Approve
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
