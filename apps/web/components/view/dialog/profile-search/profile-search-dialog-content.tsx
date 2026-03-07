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
import { useProfileContentSearch } from '@/hooks/queries/use-profile-content-search'
import { useDebounce } from '@/hooks/use-debounce'
import { toastError } from '@/lib/toasts'
import { UserContent } from '@/lib/model/content'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { getModalParams, ModalType } from '@/stores/modal'
import { contentCategoryLabels } from '@/utils/api/constants'
import React from 'react'

export default function ProfileSearchDialogContent() {
  const { setModalParams, openModal } = useModalStore(
    (state) => state,
  )
  const rawModalParams = useModalStore((state) => state.modalParams)
  const modalParams = React.useMemo(
    () => getModalParams(ModalType.ProfileSearch, rawModalParams),
    [rawModalParams],
  )
  const { profile } = useProfileStore((state) => state)
  const [query, setQuery] = React.useState<string>(
    modalParams?.query ?? '',
  )
  const debouncedQuery = useDebounce(query, 300)

  const { data: result, error } = useProfileContentSearch({
    profile: profile ?? undefined,
    query: debouncedQuery,
    page: 0,
    size: 10,
  })

  React.useEffect(() => {
    if (!modalParams) return
    if (modalParams.query === debouncedQuery) return
    setModalParams({ ...modalParams, query: debouncedQuery })
  }, [debouncedQuery, modalParams?.query, setModalParams])

  React.useEffect(() => {
    if (error) {
      toastError('Failed to fetch search results', error)
    }
  }, [error])

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
      toastError(
        `This content wasn't mentioned in the profile of ${profile?.displayName}`,
      )
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
