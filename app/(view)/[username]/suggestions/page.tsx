'use client'

import { Button } from '@/components/ui/button'
import { getContentCategoryIcon } from '@/components/ui/content-category-icon'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { localizeContentCategory } from '@/lib/localize-types'
import { VISIBLE_CONTENT_CATEGORIES } from '@/lib/model/content'
import { useMediaQuery } from '@/lib/use-media-query'
import useFilterQueryState from '@/query-params/filter'
import useSortQueryState from '@/query-params/sort'
import {
  CheckIcon,
  FilterIcon,
  LoaderIcon,
  SortAscIcon,
  SortDescIcon,
  XIcon,
} from 'lucide-react'
import React from 'react'
import SuggestionList from './suggestion-list'
import { cn } from '@/lib/utils'
import SortDrawer from '@/components/ui/sort-drawer'
import FiltersDrawer, {
  FiltersDrawerFilter,
  FiltersDrawerFilterOption,
} from '@/components/ui/filters-drawer'

const SortOptions = [
  {
    label: 'Newest',
    value: 'created_at.desc',
    icon: SortDescIcon,
  },
  {
    label: 'Oldest',
    value: 'created_at.asc',
    icon: SortAscIcon,
  },
]

const StatusFilterOptions: FiltersDrawerFilterOption[] = [
  {
    label: 'Pending',
    value: 'pending',
    icon: LoaderIcon,
  },
  {
    label: 'Accepted',
    value: 'approved',
    icon: CheckIcon,
  },
  {
    label: 'Rejected',
    value: 'rejected',
    icon: XIcon,
  },
]

const filterDrawerFilters: FiltersDrawerFilter[] = [
  {
    type: 'select',
    label: 'Suggestion Category',
    field: 'category',
    options: VISIBLE_CONTENT_CATEGORIES.map((category) => ({
      label: localizeContentCategory(category, true),
      value: category,
      icon: getContentCategoryIcon(category),
    })),
  },
  {
    type: 'select',
    label: 'Suggestion Status',
    field: 'status',
    options: StatusFilterOptions,
  },
]

export default function SuggestionsPage() {
  const {
    sort,
    setSort,
    isInitialized: isSortInitialized,
  } = useSortQueryState('created_at.desc')
  const {
    filters,
    addFilter,
    removeFilter,
    getFilter,
    clearFilters,
    isInitialized: isFilterInitialized,
  } = useFilterQueryState([])

  const isInitialized = isSortInitialized && isFilterInitialized

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const SortIcon = React.useMemo(
    () => SortOptions.find((option) => option.value === sort)?.icon,
    [sort],
  )

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      removeFilter('category')
      return
    }

    addFilter('category', value)
  }

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      removeFilter('status')
      return
    }
    addFilter('status', value)
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {isDesktop ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {SortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sort === option.value ? 'default' : 'secondary'}
                onClick={() => setSort(option.value)}
              >
                <div className="flex items-center gap-2">
                  <option.icon className="size-4" />
                  {option.label}
                </div>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Select
              onValueChange={handleCategoryChange}
              value={getFilter('category')?.value ?? 'all'}
            >
              <SelectTrigger className="h-9 w-auto">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {VISIBLE_CONTENT_CATEGORIES.map((category) => {
                  const Icon = getContentCategoryIcon(category)
                  return (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        {localizeContentCategory(category, true)}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select
              onValueChange={handleStatusChange}
              value={getFilter('status')?.value ?? 'all'}
            >
              <SelectTrigger className="h-9 w-auto">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {StatusFilterOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="size-4" />}
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <SortDrawer
            sortOptions={SortOptions}
            value={sort}
            onChange={setSort}
            onReset={() => setSort('created_at.desc')}
          >
            <Button variant="secondary" className="w-full">
              {SortIcon && <SortIcon className="size-4" />}
              {SortOptions.find((option) => option.value === sort)?.label}
            </Button>
          </SortDrawer>
          <FiltersDrawer filters={filterDrawerFilters}>
            <Button variant="secondary" className="w-full">
              <FilterIcon className="size-4" />
              Filters&nbsp;
              {filters.length > 0 && `(${filters.length})`}
            </Button>
          </FiltersDrawer>
          {/* <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary" className="w-full">
                <FilterIcon className="size-4" />
                Filters&nbsp;
                {filters.length > 0 && `(${filters.length})`}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Suggestion Categories</DrawerTitle>
                <DrawerDescription className="hidden">
                  Filter suggestions by category, status, and more.
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="grid grid-cols-3 gap-2">
                  {VISIBLE_CONTENT_CATEGORIES.map((category) => {
                    const Icon = getContentCategoryIcon(category)
                    return (
                      <DrawerClose key={category} asChild>
                        <Button
                          value={category}
                          variant={
                            getFilter('category')?.value === category
                              ? 'default'
                              : 'link'
                          }
                          onClick={() => handleCategoryChange(category)}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="size-4" />
                            {localizeContentCategory(category, true)}
                          </div>
                        </Button>
                      </DrawerClose>
                    )
                  })}
                </div>
                <h2 className="pt-4 text-lg font-semibold">
                  Suggestion Status
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {StatusFilterOptions.map((option) => (
                    <DrawerClose key={option.value} asChild>
                      <Button
                        variant={
                          getFilter('status')?.value === option.value
                            ? 'default'
                            : 'link'
                        }
                        className="w-full"
                        onClick={() => addFilter('status', option.value)}
                      >
                        <div className="flex items-center gap-2">
                          <option.icon className="size-4" />
                          {option.label}
                        </div>
                      </Button>
                    </DrawerClose>
                  ))}
                </div>
              </div>
              <DrawerFooter className="mt-4">
                <DrawerClose asChild>
                  <Button variant="destructive" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer> */}
        </div>
      )}
      {isInitialized && <SuggestionList sort={sort} filters={filters} />}
    </div>
  )
}
