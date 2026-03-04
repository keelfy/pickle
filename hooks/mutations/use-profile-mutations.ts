'use client'

import { User, UserAvatar, UsernameValidation } from '@/lib/model/user'
import { CoverPreview } from '@/lib/model/cover'
import { queryKeys } from '@/lib/query-keys'
import { UpdateProfileReq } from '@/utils/api/request'
import { fetchApi } from '@/utils/api/client'
import { useMutation, useQuery } from '@tanstack/react-query'

export function useMyAvatar(size: 'sm' | 'md' | 'lg' = 'md') {
  return useQuery({
    queryKey: queryKeys.users.avatar(size),
    queryFn: () =>
      fetchApi<UserAvatar>(
        `/v1/users/me/avatar`,
        new URLSearchParams([['size', size]]),
      ),
  })
}

export function useValidateUsername(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.validateUsername(username),
    queryFn: () =>
      fetchApi<UsernameValidation>(
        `/v1/users/validate-username`,
        new URLSearchParams([['username', username]]),
      ),
    enabled: enabled && username.length > 0,
  })
}

export function useUpdateMeMutation() {
  return useMutation({
    mutationFn: (data: UpdateProfileReq) =>
      fetchApi<void>(`/v1/users/me`, new URLSearchParams(), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  })
}

export function useUploadAvatarForPreviewMutation() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      fetchApi<UserAvatar>(`/v1/users/me/avatar`, new URLSearchParams(), {
        method: 'POST',
        body: formData,
      }),
  })
}

export function useUploadPosterPreviewMutation() {
  return useMutation({
    mutationFn: ({
      user,
      formData,
      size = 'md',
    }: {
      user: User
      formData: FormData
      size?: 'sm' | 'md' | 'lg'
    }) =>
      fetchApi<CoverPreview>(
        `/v1/users/${user.id}/posters/previews`,
        new URLSearchParams([['coverSize', size]]),
        {
          method: 'POST',
          body: formData,
        },
      ),
  })
}

export function useDeletePosterPreviewMutation() {
  return useMutation({
    mutationFn: ({ user, id }: { user: User; id: string }) =>
      fetchApi(
        `/v1/users/${user.id}/posters/previews/${id}`,
        new URLSearchParams(),
        {
          method: 'DELETE',
        },
      ),
  })
}
