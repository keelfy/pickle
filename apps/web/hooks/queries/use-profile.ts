'use client'

import { profileByUsernameQueryOptions } from '@/lib/query-options'
import { ImageSize } from '@/lib/model/types'
import { fetchApi } from '@/utils/api/client'
import { useQuery } from '@tanstack/react-query'

export function useProfile(username: string, avatarSize: ImageSize = 'lg') {
  return useQuery({
    ...profileByUsernameQueryOptions(fetchApi, username, avatarSize),
    enabled: Boolean(username),
  })
}
