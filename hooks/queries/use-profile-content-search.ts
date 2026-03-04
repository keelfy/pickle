'use client'

import { queryKeys } from '@/lib/query-keys'
import { Profile } from '@/lib/model/user'
import { fetchApi } from '@/utils/api/client'
import { Paginated } from '@/utils/api/response'
import { UserContent } from '@/lib/model/content'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

type UseProfileContentSearchParams = {
  profile?: Profile
  query: string
  page?: number
  size?: number
}

export function useProfileContentSearch({
  profile,
  query,
  page = 0,
  size = 10,
}: UseProfileContentSearchParams) {
  const isEnabled = Boolean(
    profile?.id && query && query.length >= 2 && query.length <= 100,
  )

  return useQuery({
    queryKey: queryKeys.profiles.contentSearch(profile?.id ?? '', query, page, size),
    queryFn: () =>
      fetchApi<Paginated<UserContent>>(
        `/v1/users/${(profile as Profile).id}/content`,
        new URLSearchParams([
          ['query', query],
          ['page', page.toString()],
          ['size', size.toString()],
        ]),
      ),
    enabled: isEnabled,
    placeholderData: keepPreviousData,
  })
}
