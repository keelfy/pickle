'use client'

import { queryKeys } from '@/lib/query-keys'
import { Content, ContentCategory } from '@/lib/model/content'
import { ImageSize } from '@/lib/model/types'
import { fetchApi } from '@/utils/api/client'
import { Paginated } from '@/utils/api/response'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

type UseContentSearchParams = {
  category?: ContentCategory
  query: string
  page?: number
  size?: number
  userId?: string
}

export function useContentSearch({
  category,
  query,
  page = 0,
  size = 10,
  userId,
}: UseContentSearchParams) {
  const isEnabled = Boolean(
    category && query && query.length >= 2 && query.length <= 100,
  )

  return useQuery({
    queryKey: queryKeys.content.search(
      category ?? 'games',
      query,
      page,
      size,
      userId,
    ),
    queryFn: () => {
      const params: [string, string][] = [
        ['locale', 'en'],
        ['query', query],
        ['page', page.toString()],
        ['size', size.toString()],
        ['coverSize', 'sm' satisfies ImageSize],
      ]
      if (userId) params.push(['userId', userId])
      return fetchApi<Paginated<Content>>(
        `/v1/content/${category ?? 'games'}`,
        new URLSearchParams(params),
      )
    },
    enabled: isEnabled,
    placeholderData: keepPreviousData,
  })
}
