'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  useAddCollectionItemMutation,
} from '@/hooks/mutations/use-collection-mutations'
import { useProfileContentSearch } from '@/hooks/queries/use-profile-content-search'
import { useDebounce } from '@/hooks/use-debounce'
import { toastError } from '@/lib/toasts'
import { CollectionItem } from '@/lib/model/collection'
import { UserContent } from '@/lib/model/content'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { getModalParams, ModalType } from '@/stores/modal'
import { contentCategoryLabels } from '@/utils/api/constants'
import React from 'react'
import { useCollectionContext } from '../../../ui/content-collections/collections-context'

export default function AddCollectionItemDialogContent() {
  const { setModalParams, openModal, closeModal } = useModalStore(
    (state) => state,
  )
  const rawModalParams = useModalStore((state) => state.modalParams)
  const modalParams = React.useMemo(
    () => getModalParams(ModalType.AddCollectionItem, rawModalParams),
    [rawModalParams],
  )
  const profile = useProfileStore((state) => state.profile)
  const [query, setQuery] = React.useState<string>(modalParams?.query ?? '')
  const debouncedQuery = useDebounce(query, 300)
  const { data: result, error } = useProfileContentSearch({
    profile: profile ?? undefined,
    query: debouncedQuery,
    page: 0,
    size: 10,
  })
  const {
    states: collections,
    addItemToCollection,
    deleteItemFromCollection,
    updateItemInCollection,
  } = useCollectionContext()
  const addCollectionItemMutation = useAddCollectionItemMutation()

  const GroupHeading: React.ReactNode = React.useMemo(
    () => (
      <>
        Best matches for profile&nbsp;
        <span className="font-bold">{profile?.displayName}</span>
      </>
    ),
    [profile?.displayName],
  )
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0)

  React.useEffect(() => {
    if (!modalParams) return
    if (modalParams.query === debouncedQuery) return
    setModalParams({ ...modalParams, query: debouncedQuery })
  }, [debouncedQuery, modalParams?.id, modalParams?.query, setModalParams])

  React.useEffect(() => {
    if (error) {
      toastError('Failed to fetch search results', error)
    }
  }, [error])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [result?.content])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!result?.content?.length) return

      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) =>
          Math.min(prev + 1, result.content.length - 1),
        )
      } else if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (event.key === 'Enter') {
        const selectedContent = result.content[selectedIndex]
        if (selectedContent) {
          handleItemClick(selectedContent)
        }
      }
    },
    [result?.content, selectedIndex, openModal],
  )

  const handleItemClick = (source: UserContent) => {
    if (!modalParams?.id || !profile) return
    const collectionId = modalParams.id
    const sameNote = collections.some(
      (collection) =>
        collection.collection.id === collectionId &&
        collection.content.some(
          (item) =>
            item.content.id === source.id &&
            item.content.category === source.category,
        ),
    )

    if (sameNote) {
      toastError(
        `Already in collection`,
        `"${source.title}" is already in the collection`,
      )
      return
    }

    closeModal()
    ;(async () => {
      const optimisticCollectionItem: CollectionItem = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        collectionId: modalParams.id,
        content: source,
      }
      addItemToCollection(modalParams.id, optimisticCollectionItem)

      try {
        const response = await addCollectionItemMutation.mutateAsync({
          user: profile,
          collectionId: modalParams.id,
          req: {
            itemId: source.id,
            category: source.category,
          },
        })
        updateItemInCollection(
          modalParams.id,
          optimisticCollectionItem.id,
          response,
        )
      } catch (error) {
        deleteItemFromCollection(
          modalParams.id,
          optimisticCollectionItem.id,
        )
        toastError('Failed to add item to collection', error)
      }
    })()
  }

  return (
    <>
      <CommandInput
        placeholder="Search for content in this profile"
        onValueChange={setQuery}
        value={query}
        onKeyDown={handleKeyDown}
      />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        {result?.content && result.content.length > 0 && (
          <CommandGroup heading={GroupHeading} className="pb-2">
            {result?.content.map((content) => (
              <CommandItem
                key={content.id}
                asChild
                className="cursor-pointer p-2"
              >
                <Button
                  className="flex w-full items-center justify-between"
                  variant="ghost"
                  onClick={() => handleItemClick(content)}
                >
                  <div className="text-md">{content.title}</div>
                  <Badge>
                    {
                      contentCategoryLabels.find(
                        (cat) => cat.value === content.category,
                      )?.label
                    }
                  </Badge>
                </Button>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </>
  )
}
