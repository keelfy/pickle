'use client'

import { ContentCategory, DetailedGame, DetailedMovie } from '@/lib/model/content'
import { ImageSize } from '@/lib/model/types'
import { queryKeys } from '@/lib/query-keys'
import { fetchApi } from '@/utils/api/client'
import { useQuery } from '@tanstack/react-query'

type UseContentDetailParams = {
  category: ContentCategory
  contentId: string
  coverSize?: ImageSize
}

export function useContentDetail({
  category,
  contentId,
  coverSize = 'md',
}: UseContentDetailParams) {
  return useQuery({
    queryKey: queryKeys.content.detail(category, contentId),
    queryFn: () =>
      fetchApi<DetailedGame | DetailedMovie>(
        `/v1/content/${category}/${contentId}`,
        new URLSearchParams([
          ['coverSize', coverSize],
          ['locale', 'en'],
        ]),
      ),
    enabled: Boolean(contentId),
  })
}
