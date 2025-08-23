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
import { getContentCategoryIcon } from '@/components/ui/content-category-icon'
import { fetchProfileContentSearch } from '@/hooks/api-endpoints-client'
import { toast } from '@/hooks/use-toast'
import { UserContent } from '@/lib/model/content'
import { Paginated } from '@/lib/model/types'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { ModalType } from '@/stores/modal'
import { contentCategoryLabels } from '@/utils/api/constants'
import React from 'react'

export default function ProfileSearchDialogContent() {
  const { modalParams, setModalParams, openModal } = useModalStore(
    (state) => state,
  )
  const { profile } = useProfileStore((state) => state)
  const [query, setQuery] = React.useState<string>(
    (modalParams?.query as string) ?? '',
  )
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>('')
  const [result, setResult] = React.useState<Paginated<UserContent>>()
  const [isLoading, startTransition] = React.useTransition()

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query)
      setModalParams({
        query,
      })
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [query])

  React.useEffect(() => {
    if (
      !debouncedQuery ||
      debouncedQuery.length < 2 ||
      debouncedQuery.length > 100 ||
      !profile
    ) {
      setResult(undefined)
      return
    }

    startTransition(async () => {
      try {
        const response = await fetchProfileContentSearch(
          profile,
          debouncedQuery,
          0,
          10,
        )
        setResult(response)
      } catch (error) {
        toast({
          title: 'Failed to fetch search results',
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
      }
    })
  }, [debouncedQuery, profile])

  const [selectedIndex, setSelectedIndex] = React.useState<number>(0)

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
          handleEntryClick(selectedContent)
        }
      }
    },
    [result?.content, selectedIndex, openModal],
  )

  const handleEntryClick = ({ category, noteId }: UserContent) => {
    if (!noteId) {
      toast({
        title: 'Content not in profile',
        description: `This content wasn't mentioned in the profile of ${profile?.displayName}`,
        variant: 'destructive',
      })
      return
    }
    switch (category) {
      case 'games':
        openModal(ModalType.GameNote, { noteId })
        break
      case 'movies':
        openModal(ModalType.MovieNote, { noteId })
        break
    }
  }

  const GroupHeadings: React.ReactNode[] = React.useMemo(
    () => [
      <>
        <span className="font-bold">Best matches</span> for profile&nbsp;
        <span className="font-bold">{profile?.displayName}</span>
      </>,
      <>
        <span className="font-bold">Not mentioned</span> in profile&nbsp;
        <span className="font-bold">{profile?.displayName}</span>
      </>,
    ],
    [profile?.displayName],
  )

  const sortAndGroupResults = React.useMemo(() => {
    const inProfile = result?.content.filter((content) => content.noteId) ?? []
    const notInProfile =
      result?.content.filter((content) => !content.noteId) ?? []
    return [inProfile, notInProfile]
  }, [result?.content])

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
        {sortAndGroupResults.map((group, index) => {
          if (group.length === 0) return null
          return (
            <CommandGroup
              key={index}
              heading={GroupHeadings[index]}
              className="pb-2"
            >
              {group.map((content) => {
                const CategoryIcon = getContentCategoryIcon(content.category)
                return (
                  <CommandItem
                    key={content.id}
                    asChild
                    className="cursor-pointer p-2"
                  >
                    <Button
                      className="flex w-full items-center justify-between"
                      variant="ghost"
                      onClick={() => handleEntryClick(content)}
                    >
                      <div className="text-md">{content.title}</div>
                      <Badge className="flex items-center gap-1 text-xs">
                        <CategoryIcon className="size-1" />
                        {
                          contentCategoryLabels.find(
                            (cat) => cat.value === content.category,
                          )?.label
                        }
                      </Badge>
                    </Button>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}
      </CommandList>
    </>
  )
}
