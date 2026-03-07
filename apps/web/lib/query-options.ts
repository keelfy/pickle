import { DetailedUser, Profile } from '@/lib/model/user'
import { ImageSize } from '@/lib/model/types'
import { queryOptions } from '@tanstack/react-query'
import { queryKeys } from './query-keys'

type FetchApiFn = <T>(
  url: string,
  params?: URLSearchParams,
  options?: RequestInit,
) => Promise<T>

export function meQueryOptions(
  fetcher: FetchApiFn,
  avatarSize: ImageSize = 'md',
) {
  return queryOptions({
    queryKey: queryKeys.users.me(),
    queryFn: () =>
      fetcher<DetailedUser>(
        '/v1/users/me',
        new URLSearchParams([['avatarSize', avatarSize]]),
      ),
  })
}

export function profileByUsernameQueryOptions(
  fetcher: FetchApiFn,
  username: string,
  avatarSize: ImageSize = 'lg',
) {
  return queryOptions({
    queryKey: queryKeys.profiles.byUsername(username),
    queryFn: () =>
      fetcher<Profile>(
        `/v1/profiles/${username}`,
        new URLSearchParams([['avatarSize', avatarSize]]),
      ),
  })
}
