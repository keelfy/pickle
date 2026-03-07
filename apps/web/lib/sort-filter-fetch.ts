import { useSortFilterInfinite } from '@/hooks/queries/use-sort-filter-infinite'
import { Filter } from '@/query-params/filter'
import React from 'react'
import { useInView } from 'react-intersection-observer'

type UrlParams = [string, string][]

export type SortFilterFetchProps<T> = {
  sort: string
  filters: Filter[]
  isInitialized: boolean
  fetchFunction: (params: URLSearchParams) => Promise<T[]>
  getCursorValue: (item: T, column: string) => string
  urlParams?: UrlParams
  trackedValue?: string
}

export type SortFilterFetchResult<T> = {
  contents: T[]
  pages: T[][]
  viewRef: React.Ref<HTMLDivElement>
  isLoading: boolean
}

export function useSortFilterFetch<T>({
  sort,
  filters,
  isInitialized,
  getCursorValue,
  urlParams = [],
  fetchFunction,
  trackedValue,
}: SortFilterFetchProps<T>) {
  const { ref: viewRef, inView } = useInView()
  const infiniteQuery = useSortFilterInfinite<T>({
    key: ['sort-filter-fetch', sort, filters, urlParams, trackedValue ?? ''],
    sort,
    filters,
    enabled: isInitialized,
    fetchFunction,
    getCursorValue,
    urlParams,
  })

  const contents = React.useMemo(
    () => infiniteQuery.data?.pages.flat() ?? [],
    [infiniteQuery.data?.pages],
  )
  const pages = React.useMemo(
    () => infiniteQuery.data?.pages ?? [],
    [infiniteQuery.data?.pages],
  )

  React.useEffect(() => {
    if (inView && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      void infiniteQuery.fetchNextPage()
    }
  }, [
    inView,
    infiniteQuery.hasNextPage,
    infiniteQuery.isFetchingNextPage,
    infiniteQuery.fetchNextPage,
  ])

  return {
    contents,
    pages,
    viewRef,
    isLoading: infiniteQuery.isPending || infiniteQuery.isFetchingNextPage,
  }
}
