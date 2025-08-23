import { BatchCollectionItems, Collection } from '@/lib/model/collection'
import { ImageSize } from '@/lib/model/types'
import { DetailedUser, Profile, User, UserAvatar } from '@/lib/model/user'
import { fetchApi } from '@/utils/api/server'

export async function fetchUserById(user: User, avatarSize: ImageSize = 'lg') {
  return fetchApi<DetailedUser>(
    `/v1/users/${user.id}`,
    new URLSearchParams([['avatarSize', avatarSize]]),
  )
}

export async function fetchUser(avatarSize: ImageSize = 'md') {
  return fetchApi<DetailedUser>(
    `/v1/users/me`,
    new URLSearchParams([['avatarSize', avatarSize]]),
  )
}

export async function fetchProfileByUsername(
  username: string,
  avatarSize: ImageSize = 'lg',
) {
  return fetchApi<Profile>(
    `/v1/profiles/${username}`,
    new URLSearchParams([['avatarSize', avatarSize]]),
  )
}

export async function fetchMyAvatar(size: ImageSize = 'md') {
  return fetchApi<UserAvatar>(
    `/v1/users/me/avatar`,
    new URLSearchParams([['avatarSize', size]]),
  )
}

export async function fetchCollections(user: User) {
  return fetchApi<Collection[]>(
    `/v1/users/${user.id}/collections`,
    new URLSearchParams(),
  )
}

export async function fetchCollectionsItems(user: User, size: number = 10) {
  return fetchApi<BatchCollectionItems[]>(
    `/v1/users/${user.id}/collections/items`,
    new URLSearchParams([['coverSize', size.toString()]]),
  )
}
