'use client'

import { Filter, serializeFilter } from '@/query-params/filter'
import { useInfiniteQuery } from '@tanstack/react-query'

type UrlParams = [string, string][]

type UseSortFilterInfiniteProps<T> = {
  key: readonly unknown[]
  sort: string
  filters: Filter[]
  enabled: boolean
  fetchFunction: (params: URLSearchParams) => Promise<T[]>
  getCursorValue: (item: T, column: string) => string
  urlParams?: UrlParams
}

export function useSortFilterInfinite<T>({
  key,
  sort,
  filters,
  enabled,
  fetchFunction,
  getCursorValue,
  urlParams = [],
}: UseSortFilterInfiniteProps<T>) {
  const sortColumn = sort.split('.')[0] ?? 'created_at'
  const sortDirection = sort.split('.')[1] ?? 'desc'

  return useInfiniteQuery({
    queryKey: key,
    enabled,
    initialPageParam: '',
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: '20',
        column: sortColumn,
        direction: sortDirection,
      })

      urlParams.forEach(([paramKey, value]) => {
        params.append(paramKey, value)
      })

      if (pageParam) {
        params.append('cursor', pageParam)
      }

      if (filters.length > 0) {
        params.append('filters', filters.map((filter) => serializeFilter(filter)).join(','))
      }

      return fetchFunction(params)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) {
        return undefined
      }

      const lastItem = lastPage[lastPage.length - 1]
      const nextCursor = getCursorValue(lastItem, sortColumn)
      return nextCursor.length > 0 ? nextCursor : undefined
    },
  })
}
