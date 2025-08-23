'use client'

import { Button } from '@/components/ui/button'
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { fetchContentSearch } from '@/hooks/api-endpoints-client'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from '@/hooks/use-toast'
import { Content, ContentCategory } from '@/lib/model/content'
import { Paginated } from '@/lib/model/types'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { ModalType } from '@/stores/modal'
import Image from 'next/image'
import React from 'react'

export default function SelectContentItemDialogContent() {
  const profile = useProfileStore((state) => state.profile)
  const { modalParams, setModalParams, openModal } = useModalStore(
    (state) => state,
  )
  const [query, setQuery] = React.useState<string>(
    (modalParams?.query as string) ?? '',
  )
  const debouncedQuery = useDebounce(query, 300)
  const [result, setResult] = React.useState<Paginated<Content>>()

  const [selectedIndex, setSelectedIndex] = React.useState<number>(0)

  React.useEffect(() => {
    setModalParams({ ...modalParams, query: debouncedQuery })
  }, [debouncedQuery])

  React.useEffect(() => {
    if (
      !debouncedQuery ||
      debouncedQuery.length < 2 ||
      debouncedQuery.length > 100
    ) {
      setResult(undefined)
      return
    }

    ;(async () => {
      try {
        const response = await fetchContentSearch(
          modalParams?.category as ContentCategory,
          debouncedQuery,
          0,
          10,
          profile?.id,
        )
        setResult(response)
      } catch (error) {
        toast({
          title: 'Failed to fetch search results',
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    })()
  }, [debouncedQuery])

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
