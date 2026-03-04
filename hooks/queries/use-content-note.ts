'use client'

import { ContentCategory } from '@/lib/model/content'
import { ImageSize } from '@/lib/model/types'
import { DetailedContentNote } from '@/lib/model/content-note'
import { User } from '@/lib/model/user'
import { queryKeys } from '@/lib/query-keys'
import { fetchApi } from '@/utils/api/client'
import { useQuery } from '@tanstack/react-query'

type UseContentNoteParams<T extends DetailedContentNote> = {
  user?: User
  category: ContentCategory
  noteId: string
  coverSize?: ImageSize
}

export function useContentNote<T extends DetailedContentNote>({
  user,
  category,
  noteId,
  coverSize = 'md',
}: UseContentNoteParams<T>) {
  return useQuery({
    queryKey: queryKeys.contentNotes.detail(user?.id ?? '', category, noteId),
    queryFn: () =>
      fetchApi<T>(
        `/v1/content-notes/${category}/${noteId}`,
        new URLSearchParams([['coverSize', coverSize]]),
      ),
    enabled: Boolean(user?.id && noteId),
  })
}
