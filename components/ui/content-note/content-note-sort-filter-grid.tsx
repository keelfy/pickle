'use client'

import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchBatchContentNoteReactions,
  fetchProfileContentNotes,
} from '@/hooks/api-endpoints-client'
import { toast } from '@/hooks/use-toast'
import { localizeContentCategory } from '@/lib/localize-types'
import { ContentCategory } from '@/lib/model/content'
import { DetailedContentNote } from '@/lib/model/content-note'
import {
  ContentNoteReaction,
  ContentNoteReactions,
} from '@/lib/model/note-reaction'
import { useSortFilterFetch } from '@/lib/sort-filter-fetch'
import { useMediaQuery } from '@/lib/use-media-query'
import { useProfileStore } from '@/providers/profile-store'
import useFilterQueryState, { Filter } from '@/query-params/filter'
import useSortQueryState from '@/query-params/sort'
import { FilterIcon, SortAscIcon, SortDescIcon } from 'lucide-react'
import React from 'react'
import FiltersDrawer, { FiltersDrawerFilter } from '../filters-drawer'
import SortDrawer from '../sort-drawer'
import ContentNoteGridFilters, {
  ContentNoteGridSelectFilterOption,
} from './content-note-grid-filters'

export type ContentNoteGridSortOption = {
  label: string
  value: string // "column_name.direction", e.g. "created_at.desc"
}

type Props<T extends DetailedContentNote> = {
  category: ContentCategory
  sortOptions: ContentNoteGridSortOption[]
  getCursorValue: (item: T, column: string) => string
  getContentNoteCard: (
    note: T,
    defaultReactions?: ContentNoteReaction[],
  ) => React.ReactNode
  filtering: {
    statusOptions: ContentNoteGridSelectFilterOption[]
  }
  header?: React.ReactNode
}

export default function ContentNoteSortFilterGrid<
  T extends DetailedContentNote,
>({
  category,
  sortOptions,
  getCursorValue,
  getContentNoteCard,
  filtering,
  header,
}: Props<T>) {
  const profile = useProfileStore((state) => state.profile)
  const [reactions, setReactions] = React.useState<ContentNoteReactions[]>()
  const isSmallScreen = useMediaQuery('(max-width: 640px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const {
    sort,
    setSort,
    isInitialized: isSortInitialized,
  } = useSortQueryState('created_at.desc')

  const {
    filters,
    getFilter,
    addFilter,
    removeFilter,
    clearFilters,
    setFilters,
    isInitialized: isFilterInitialized,
  } = useFilterQueryState()

  const [requester, setRequester] = React.useState<string>(
    getFilter('requester')?.value ?? '',
  )

  const { contents, viewRef, isLoading } = useSortFilterFetch<T>({
    sort,
    filters,
    isInitialized: isSortInitialized && isFilterInitialized,
    fetchFunction: async (params) => {
      if (!profile) return []
      try {
        return await fetchProfileContentNotes<T>(profile, category, params)
      } catch (error) {
        toast({
          title: `Failed to fetch ${localizeContentCategory(category, false).toLowerCase()} notes`,
          description:
            error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        })
        throw error
      }
    },
    getCursorValue,
    trackedValue: category,
  })

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
  }

  const handleFiltersChange = (newFilters: Filter[]) => {
    setFilters(newFilters)
  }

  React.useEffect(() => {
    if (!contents || contents.length === 0 || !profile?.id) return
    const fetchReactions = async () => {
      try {
        const reactions = await fetchBatchContentNoteReactions(
          profile,
          category,
          contents.map((note) => note.id),
        )
        if (reactions) {
          setReactions(reactions)
        }
      } catch (error) {
        console.error(error)
      }
    }
    fetchReactions()
  }, [contents])

  const filterDrawerFilters: FiltersDrawerFilter[] = [
    {
      type: 'select',
      label: 'Status',
      field: 'status',
      options: filtering.statusOptions,
    },
    {
      type: 'input',
      label: 'Requester',
      field: 'requester',
      placeholder: 'Username',
    },
  ]

  return (
    <>
      <div className="flex w-full items-center justify-between gap-4">
        {header}
        <div className="flex w-full items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            {isDesktop ? (
              <>
                <Select
                  onValueChange={handleSortChange}
                  defaultValue={sort}
                  value={sort}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      size={isSmallScreen ? 'icon' : 'default'}
                      disabled={isLoading}
                    >
                      <FilterIcon />
                      <span className="hidden sm:inline">Filter</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end">
                    <ContentNoteGridFilters
                      value={filters}
                      onChange={handleFiltersChange}
                      statusOptions={filtering.statusOptions}
                    />
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <>
                <SortDrawer
                  sortOptions={sortOptions}
                  value={sort}
                  onChange={handleSortChange}
                  onReset={() => setSort('created_at.desc')}
                >
                  <Button
                    variant="secondary"
                    size={isSmallScreen ? 'icon' : 'default'}
                    disabled={isLoading}
                  >
                    {sort.includes('asc') ? <SortAscIcon /> : <SortDescIcon />}
                    <span className="hidden sm:inline">
                      {
                        sortOptions.find((option) => option.value === sort)
                          ?.label
                      }
                    </span>
                  </Button>
                </SortDrawer>
                <FiltersDrawer filters={filterDrawerFilters}>
                  <Button
                    variant="secondary"
                    size={
                      isSmallScreen && filters.length === 0 ? 'icon' : 'default'
                    }
                    disabled={isLoading}
                    className="gap-1"
                  >
                    <FilterIcon />
                    <span className="sr-only">Filters</span>
                    <span className="hidden sm:inline">Filters</span>
                    {filters.length > 0 && (
                      <span>&nbsp;({filters.length})</span>
                    )}
                  </Button>
                </FiltersDrawer>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-6">
        {contents.map((note) => {
          const defaultReactions = reactions
            ?.filter((reaction) => reaction.contentNoteId === note.id)
            .flatMap((reaction) => reaction.reactions)
          return (
            <div key={note.id}>
              {getContentNoteCard(note, defaultReactions)}
            </div>
          )
        })}
        {contents.length === 0 && !isLoading && (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No {localizeContentCategory(category, true).toLowerCase()} found.
            </p>
          </div>
        )}
      </div>
      <div
        ref={viewRef}
        className="flex h-10 w-full items-center justify-center"
      >
        {isLoading && <LoadingSpinner type="bars" />}
      </div>
    </>
  )
}
