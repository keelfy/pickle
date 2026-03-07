'use client'

import { queryKeys } from '@/lib/query-keys'
import { ContentCategory } from '@/lib/model/content'
import { User } from '@/lib/model/user'
import { OrderWithDecision } from '@/lib/model/order'
import { fetchApi } from '@/utils/api/client'
import { Paginated } from '@/utils/api/response'
import { useQuery } from '@tanstack/react-query'

type UseContentNoteOrdersParams = {
  user?: User
  category: ContentCategory
  noteId?: string
  page: number
  size?: number
  enabled?: boolean
}

export function useContentNoteOrders({
  user,
  category,
  noteId,
  page,
  size = 5,
  enabled = true,
}: UseContentNoteOrdersParams) {
  return useQuery({
    queryKey: queryKeys.contentNotes.orders(
      user?.id ?? '',
      category,
      noteId ?? '',
      page,
      size,
    ),
    queryFn: () =>
      fetchApi<Paginated<OrderWithDecision>>(
        `/v1/content-notes/${category}/${noteId as string}/orders`,
        new URLSearchParams([
          ['page', page.toString()],
          ['size', size.toString()],
        ]),
      ),
    enabled: Boolean(enabled && user?.id && noteId),
  })
}
