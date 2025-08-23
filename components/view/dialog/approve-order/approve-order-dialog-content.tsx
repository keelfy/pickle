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
  approveOrderById,
  fetchContentSearch,
  fetchOrderById,
} from '@/hooks/api-endpoints-client'
import { toast } from '@/hooks/use-toast'
import { localizeContentCategory } from '@/lib/localize-types'
import { Content, ContentCategory } from '@/lib/model/content'
import { DetailedOrder } from '@/lib/model/order'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { ModalType } from '@/stores/modal'
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
  const { id: orderId } = useModalStore((state) => state.modalParams!)
  const { profile } = useProfileStore((state) => state)
  const [order, setOrder] = React.useState<DetailedOrder>()

  const [contentSearchQuery, setContentSearchQuery] = React.useState<string>('')

  const [contentSearchResults, setContentSearchResults] =
    React.useState<Paginated<Content>>()

  const [externalSearchResults, setExternalSearchResults] =
    React.useState<Paginated<Content>>()

  const [isOrderApproving, startOrderApprovingTransition] =
    React.useTransition()

  const [debouncedContentQuery, setDebouncedContentQuery] =
    React.useState<string>('')

  const [contentSearchPage, setContentSearchPage] = React.useState<number>(0)

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

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedContentQuery(contentSearchQuery)
    }, 200)

    return () => clearTimeout(timeout)
  }, [contentSearchQuery])

  React.useEffect(() => {
    setContentSearchPage(0)
  }, [debouncedContentQuery])

  React.useEffect(() => {
    if (!isSearchQueryValid) {
      setContentSearchResults(undefined)
      setExternalSearchResults(undefined)
      return
    }

    // (async () => {
    //     try {
    //         const response = await fetchProfileContentSearch(profile, debouncedContentQuery, contentSearchPage, 5);
    //         setContentSearchResults(response);
    //     } catch (error: any) {
    //         toast({
    //             title: "Failed to fetch search results",
    //             description: error.message ?? "An error occurred",
    //         });
    //     }
    // })();

    ;(async () => {
      try {
        const response = await fetchContentSearch(
          form.watch('category'),
          debouncedContentQuery,
          contentSearchPage,
          5,
          profile?.id,
        )
        setExternalSearchResults(response)
      } catch (error) {
        toast({
          title: 'Failed to fetch search results',
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    })()
  }, [debouncedContentQuery])

  React.useEffect(() => {
    if (!isSearchQueryValid || contentSearchPage === 0) {
      return
    }

    // (async () => {
    //     try {
    //         const response = await fetchProfileContentSearch(profile, debouncedContentQuery, contentSearchPage, 5);

    //         if (contentSearchResults?.content && response?.content) {
    //             setContentSearchResults({
    //                 ...response,
    //                 content: [
    //                     ...contentSearchResults.content,
    //                     ...response.content,
    //                 ],
    //             });
    //         } else {
    //             setContentSearchResults(response);
    //         }
    //     } catch (error: any) {
    //         toast({
    //             title: "Failed to fetch search results",
    //             description: error.message ?? "An error occurred",
    //         });
    //     }
    // })();

    ;(async () => {
      try {
        const response = await fetchContentSearch(
          form.watch('category'),
          debouncedContentQuery,
          contentSearchPage,
          5,
          profile?.id,
        )
        if (response?.content) {
          if (externalSearchResults?.content) {
            setExternalSearchResults({
              ...response,
              content: [...externalSearchResults.content, ...response.content],
            })
          } else {
            setExternalSearchResults(response)
          }
        }
      } catch (error) {
        toast({
          title: 'Failed to fetch search results',
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    })()
  }, [contentSearchPage])

  React.useEffect(() => {
    if (!orderId || !profile) {
      return
    }

    ;(async () => {
      try {
        const response = await fetchOrderById(profile, orderId as string)
        setOrder(response)
      } catch (error) {
        toast({
          title: 'Failed to fetch the order',
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    })()
  }, [orderId, profile])

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
    if (!orderId || !profile) {
      closeModal()
      return
    }

    startOrderApprovingTransition(async () => {
      try {
        const res = await approveOrderById(profile, orderId as string, {
          category: values.category,
          contentId: values.content?.id,
        })

        // if (!res?.contentCreated) {
        //   closeModal()
        // } else
        if (res.decision?.contentNote) {
          openContentNoteEditor(values.category, res.decision.contentNote.id)
        }
      } catch (error) {
        toast({
          title: 'Failed to approve the order',
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
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
                    externalSearchResults.totalPages - 1 >
                      externalSearchResults.page && (
                      <CommandItem
                        onSelect={() => {
                          setContentSearchPage(contentSearchPage + 1)
                        }}
                      >
                        -- Show more results --
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
