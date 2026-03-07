'use client'

import { queryKeys } from '@/lib/query-keys'
import { ContentCategory } from '@/lib/model/content'
import { User } from '@/lib/model/user'
import { ContentNoteReactions } from '@/lib/model/note-reaction'
import { fetchApi } from '@/utils/api/client'
import { useQuery } from '@tanstack/react-query'

type UseBatchContentNoteReactionsParams = {
  user?: User
  category: ContentCategory
  noteIds: string[]
}

export function useBatchContentNoteReactions({
  user,
  category,
  noteIds,
}: UseBatchContentNoteReactionsParams) {
  return useQuery({
    queryKey: queryKeys.contentNotes.batchReactions(category, noteIds),
    queryFn: () => {
      if (noteIds.length === 0) return Promise.resolve([])
      return fetchApi<ContentNoteReactions[]>(
        `/v1/users/${(user as User).id}/content-notes/${category}/reactions`,
        new URLSearchParams([['contentNoteIds', noteIds.join(',')]]),
      )
    },
    enabled: Boolean(user?.id && noteIds.length > 0),
  })
}
