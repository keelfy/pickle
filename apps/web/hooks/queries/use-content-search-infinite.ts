'use client'

import { queryKeys } from '@/lib/query-keys'
import { Content, ContentCategory } from '@/lib/model/content'
import { ImageSize } from '@/lib/model/types'
import { fetchApi } from '@/utils/api/client'
import { Paginated } from '@/utils/api/response'
import { useInfiniteQuery } from '@tanstack/react-query'

type UseContentSearchInfiniteParams = {
  category?: ContentCategory
  query: string
  size?: number
  userId?: string
}

export function useContentSearchInfinite({
  category,
  query,
  size = 5,
  userId,
}: UseContentSearchInfiniteParams) {
  const isEnabled = Boolean(
    category && query && query.length > 2 && query.length <= 100,
  )

  return useInfiniteQuery({
    queryKey: [
      ...queryKeys.content.search(category ?? 'games', query, 0, size, userId),
      'infinite',
    ],
    enabled: isEnabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchApi<Paginated<Content>>(
        `/v1/content/${category ?? 'games'}`,
        new URLSearchParams([
          ['locale', 'en'],
          ['query', query],
          ['page', pageParam.toString()],
          ['size', size.toString()],
          ['coverSize', 'sm' satisfies ImageSize],
          ...(userId ? ([['userId', userId]] as [string, string][]) : []),
        ]),
      ),
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })
}
