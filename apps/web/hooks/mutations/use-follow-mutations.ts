'use client'

import { User } from '@/lib/model/user'
import { fetchApi } from '@/utils/api/client'
import { useMutation } from '@tanstack/react-query'

export function useFollowProfileMutation() {
  return useMutation({
    mutationFn: ({ user }: { user: User }) =>
      fetchApi(`/v1/users/${user.id}/follows`, new URLSearchParams(), {
        method: 'POST',
      }),
  })
}

export function useUnfollowProfileMutation() {
  return useMutation({
    mutationFn: ({ user }: { user: User }) =>
      fetchApi(`/v1/users/${user.id}/follows`, new URLSearchParams(), {
        method: 'DELETE',
      }),
  })
}
