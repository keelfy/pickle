'use client'

import { Button } from '@/components/ui/button'
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useContentSearch } from '@/hooks/queries/use-content-search'
import { useDebounce } from '@/hooks/use-debounce'
import { Content, ContentCategory } from '@/lib/model/content'
import { toastError } from '@/lib/toasts'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { getModalParams, ModalType } from '@/stores/modal'
import Image from 'next/image'
import React from 'react'

export default function SelectContentItemDialogContent() {
  const profile = useProfileStore((state) => state.profile)
  const { setModalParams, openModal, modalParams: rawModalParams } = useModalStore(
    (state) => state,
  )
  const modalParams = React.useMemo(
    () => getModalParams(ModalType.SelectContentItem, rawModalParams),
    [rawModalParams],
  )
  const [query, setQuery] = React.useState<string>(
    modalParams?.query ?? '',
  )
  const debouncedQuery = useDebounce(query, 300)
  const { data: result, error } = useContentSearch({
    category: modalParams?.category as ContentCategory | undefined,
    query: debouncedQuery,
    page: 0,
    size: 10,
    userId: profile?.id,
  })

  const [selectedIndex, setSelectedIndex] = React.useState<number>(0)

  React.useEffect(() => {
    if (!modalParams) return
    if (modalParams.query === debouncedQuery) return
    setModalParams({ ...modalParams, query: debouncedQuery })
  }, [debouncedQuery, modalParams?.category, modalParams?.query, setModalParams])

  React.useEffect(() => {
    if (error) {
      toastError('Failed to fetch search results', error)
    }
  }, [error])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [result])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!result) return

      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) =>
          Math.min(prev + 1, result.content.length - 1),
        )
      } else if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (event.key === 'Enter') {
        const selectedContent = result.content[selectedIndex]
        if (selectedContent) {
          handleItemClick(selectedContent.id)
        }
      }
    },
    [result?.content, selectedIndex, openModal],
  )

  const handleItemClick = (id: string) => {
    switch (modalParams?.category) {
      case 'games':
        openModal(ModalType.GameNoteCreator, {
          gameId: id,
        })
        break
      case 'movies':
        openModal(ModalType.MovieNoteCreator, {
          movieId: id,
        })
        break
      default:
        break
    }
  }

  const getPlaceholder = () => {
    switch (modalParams?.category) {
      case 'games':
        return 'Search for a game in IGDB'
      case 'movies':
        return 'Search for a movie in TMDB'
      default:
        return 'Search for a content'
    }
  }

  return (
    <>
      <CommandInput
        placeholder={getPlaceholder()}
        onValueChange={setQuery}
        value={query}
        onKeyDown={handleKeyDown}
      />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        {result?.content && result.content.length > 0 && (
          <CommandGroup className="pb-2">
            {result?.content.map(({ id, title, coverUrl }) => (
              <CommandItem key={id} asChild className="cursor-pointer p-2">
                <Button
                  className="flex w-full items-center justify-start gap-2 p-0"
                  variant="ghost"
                  onClick={() => handleItemClick(id)}
                >
                  {coverUrl && (
                    <Image
                      src={coverUrl}
                      alt={title}
                      width={35}
                      height={35}
                      className="rounded-md p-1"
                      unoptimized
                    />
                  )}
                  <div className="text-md">{title}</div>
                </Button>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      {/* <Button
                variant="link"
                className="text-sm text-muted-foreground w-full"
                onClick={() => openModal(ModalType.ManualNoteCreation, { category: modalParams.category })}
            >
                I can't find the content I'm looking for. Let me add it manually.
            </Button> */}
    </>
  )
}
