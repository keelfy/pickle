'use client'

import { Moderator } from '@/lib/model/moderator'
import { User } from '@/lib/model/user'
import { queryKeys } from '@/lib/query-keys'
import { fetchApi } from '@/utils/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useModerators(user?: User) {
  return useQuery({
    queryKey: queryKeys.moderators.list(user?.id ?? ''),
    queryFn: () =>
      fetchApi<Moderator[]>(
        `/v1/users/${user!.id}/moderators`,
        new URLSearchParams(),
      ),
    enabled: Boolean(user?.id),
  })
}

export function useAddModeratorMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ user, username }: { user: User; username: string }) =>
      fetchApi<Moderator>(
        `/v1/users/${user.id}/moderators`,
        new URLSearchParams(),
        {
          method: 'POST',
          body: JSON.stringify({ username }),
        },
      ),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.moderators.list(vars.user.id),
      })
    },
  })
}

export function useDeleteModeratorMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ user, moderatorId }: { user: User; moderatorId: string }) =>
      fetchApi<void>(
        `/v1/users/${user.id}/moderators/${moderatorId}`,
        new URLSearchParams(),
        {
          method: 'DELETE',
        },
      ),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.moderators.list(vars.user.id),
      })
    },
  })
}
