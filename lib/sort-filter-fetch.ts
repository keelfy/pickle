import { Filter, serializeFilter } from '@/query-params/filter'
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
  viewRef: React.RefObject<HTMLDivElement>
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
  const [contents, setContents] = React.useState<T[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [cursor, setCursor] = React.useState<string>('')

  const { ref: viewRef, inView } = useInView()

  const fetchContents = React.useCallback(
    async (
      sort: string,
      cursor: string,
      filters: Filter[],
      resetList = false,
    ) => {
      if (isLoading) return

      const sortColumn = sort.split('.')[0] ?? 'created_at'
      const sortDirection = sort.split('.')[1] ?? 'desc'

      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          limit: '20',
          column: sortColumn,
          direction: sortDirection,
        })
        urlParams.forEach(([key, value]) => {
          params.append(key, value)
        })

        // Only add cursor if it exists and we're not resetting the list
        if (cursor.length > 0 && !resetList) {
          params.append('cursor', cursor)
        }

        if (filters.length > 0) {
          params.append(
            'filters',
            filters.map((filter) => serializeFilter(filter)).join(','),
          )
        }

        const notes = await fetchFunction(params)
        if (notes?.length === 0) {
          setHasMore(false)

          if (resetList) {
            setContents([])
          }
          return
        }

        const lastItem = notes[notes.length - 1]
        const newCursor = getCursorValue(lastItem, sortColumn)

        setCursor(newCursor)
        setContents((prev) => (resetList ? notes : [...prev, ...notes]))
      } finally {
        setIsLoading(false)
      }
    },
    [fetchFunction, urlParams, getCursorValue, isLoading],
  )

  React.useEffect(() => {
    if (inView && hasMore) {
      fetchContents(sort, cursor, filters)
    }
  }, [inView])

  React.useEffect(() => {
    if (!isInitialized) return

    setCursor('')
    setHasMore(true)
    fetchContents(sort, '', filters, true)
  }, [sort, filters, isInitialized, trackedValue])

  return { contents, viewRef, isLoading }
}
