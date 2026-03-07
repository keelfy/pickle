'use client'

import {
  ContentCategory,
} from '@/lib/model/content'
import { ContentNote } from '@/lib/model/content-note'
import { User } from '@/lib/model/user'
import { queryKeys } from '@/lib/query-keys'
import { CreateContentNoteReq } from '@/utils/api/request'
import { fetchApi } from '@/utils/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type CreateParams<R extends CreateContentNoteReq> = {
  user: User
  category: ContentCategory
  note: R
}

type UpdateParams<R extends Partial<CreateContentNoteReq>> = {
  user: User
  category: ContentCategory
  noteId: string
  note: R
}

export function useCreateContentNoteMutation<
  T extends ContentNote,
  R extends CreateContentNoteReq,
>() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ user, category, note }: CreateParams<R>) =>
      fetchApi<T>(
        `/v1/users/${user.id}/content-notes/${category}`,
        new URLSearchParams(),
        {
          method: 'POST',
          body: JSON.stringify(note),
        },
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.contentNotes.list(
          variables.user.id,
          variables.category,
          [],
          'created_at.desc',
        ),
      })
    },
  })
}

export function useUpdateContentNoteMutation<
  T extends ContentNote,
  R extends Partial<CreateContentNoteReq>,
>() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ user, category, noteId, note }: UpdateParams<R>) =>
      fetchApi<T>(
        `/v1/content-notes/${category}/${noteId}`,
        new URLSearchParams(),
        {
          method: 'PATCH',
          body: JSON.stringify(note),
        },
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.contentNotes.detail(
          variables.user.id,
          variables.category,
          variables.noteId,
        ),
      })
    },
  })
}

export function useDeleteContentNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      user,
      category,
      noteId,
      resetApprovedOrders = true,
    }: {
      user: User
      category: ContentCategory
      noteId: string
      resetApprovedOrders?: boolean
    }) =>
      fetchApi<void>(
        `/v1/content-notes/${category}/${noteId}`,
        new URLSearchParams([
          ['resetApprovedOrders', resetApprovedOrders.toString()],
        ]),
        {
          method: 'DELETE',
        },
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.contentNotes.list(
          variables.user.id,
          variables.category,
          [],
          'created_at.desc',
        ),
      })
    },
  })
}
