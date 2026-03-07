'use client'

import { ContentCategory } from '@/lib/model/content'
import { User } from '@/lib/model/user'
import { fetchApi } from '@/utils/api/client'
import { useMutation } from '@tanstack/react-query'

export function useCreateContentNoteReactionMutation() {
  return useMutation({
    mutationFn: ({
      user,
      category,
      noteId,
      emoteId,
    }: {
      user: User
      category: ContentCategory
      noteId: string
      emoteId: string
    }) =>
      fetchApi(
        `/v1/users/${user.id}/content-notes/${category}/${noteId}/reactions`,
        new URLSearchParams(),
        {
          method: 'POST',
          body: JSON.stringify({
            emoteId,
            source: 'unicode_emoji',
          }),
        },
      ),
  })
}

export function useDeleteContentNoteReactionMutation() {
  return useMutation({
    mutationFn: ({
      user,
      category,
      noteId,
      emoteId,
    }: {
      user: User
      category: ContentCategory
      noteId: string
      emoteId: string
    }) =>
      fetchApi(
        `/v1/users/${user.id}/content-notes/${category}/${noteId}/reactions`,
        new URLSearchParams(),
        {
          method: 'DELETE',
          body: JSON.stringify({
            emoteId,
            source: 'unicode_emoji',
          }),
        },
      ),
  })
}
