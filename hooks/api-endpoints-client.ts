import { Collection, CollectionItem } from '@/lib/model/collection'
import {
  Content,
  ContentCategory,
  DetailedGame,
  DetailedMovie,
  UserContent,
} from '@/lib/model/content'
import { ContentNote, DetailedContentNote } from '@/lib/model/content-note'
import { CoverPreview } from '@/lib/model/cover'
import { Moderator } from '@/lib/model/moderator'
import { ContentNoteReactions } from '@/lib/model/note-reaction'
import { DetailedOrder, OrderWithDecision } from '@/lib/model/order'
import { ImageSize } from '@/lib/model/types'
import { Profile, User, UserAvatar, UsernameValidation } from '@/lib/model/user'
import { fetchApi } from '@/utils/api/client'
import {
  AddItemToCollectionReq,
  ApproveOrderReq,
  CreateCollectionReq,
  CreateContentNoteReq,
  SuggestContentReq,
  UpdateCollectionReq,
  UpdateProfileReq,
} from '@/utils/api/request'
import { Paginated } from '@/utils/api/response'

// Profile

export async function validateUsername(username: string) {
  return fetchApi<UsernameValidation>(
    `/v1/users/validate-username`,
    new URLSearchParams([['username', username]]),
  )
}

export async function updateMe(data: UpdateProfileReq) {
  return fetchApi<void>(`/v1/users/me`, new URLSearchParams(), {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// Profile Avatar

export async function uploadAvatarForPreview(formData: FormData) {
  return fetchApi<UserAvatar>(`/v1/users/me/avatar`, new URLSearchParams(), {
    method: 'POST',
    body: formData,
  })
}

export async function fetchMyAvatar(size: ImageSize = 'md') {
  const params = [['size', size]]
  return fetchApi<UserAvatar>(
    `/v1/users/me/avatar`,
    new URLSearchParams(params),
  )
}

// Profile Search

export async function fetchProfileContentSearch(
  profile: Profile,
  query: string,
  page: number,
  size: number,
) {
  const params = [
    ['query', query],
    ['page', page.toString()],
    ['size', size.toString()],
  ]
  return fetchApi<Paginated<UserContent>>(
    `/v1/users/${profile.id}/content`,
    new URLSearchParams(params),
  )
}

// Poster Previews

export async function uploadPosterPreview(
  user: User,
  formData: FormData,
  size: ImageSize = 'md',
) {
  const params = [['coverSize', size]]
  return fetchApi<CoverPreview>(
    `/v1/users/${user.id}/posters/previews`,
    new URLSearchParams(params),
    {
      method: 'POST',
      body: formData,
    },
  )
}

export async function deletePosterPreview(user: User, id: string) {
  return fetchApi(
    `/v1/users/${user.id}/posters/previews/${id}`,
    new URLSearchParams(),
    {
      method: 'DELETE',
    },
  )
}

// Orders

export async function fetchProfileOrders(user: User, params: URLSearchParams) {
  return fetchApi<OrderWithDecision[]>(
    `/v1/users/${user.id}/orders`,
    new URLSearchParams(params),
  )
}

export async function fetchOrderById(profile: Profile, orderId: string) {
  return fetchApi<DetailedOrder>(
    `/v1/users/${profile.id}/orders/${orderId}`,
    new URLSearchParams(),
  )
}

export async function suggestContent(user: User, order: SuggestContentReq) {
  return fetchApi<DetailedOrder>(
    `/v1/users/${user.id}/orders/suggest`,
    new URLSearchParams(),
    {
      method: 'POST',
      body: JSON.stringify(order),
    },
  )
}

export async function rejectOrderById(user: User, orderId: string) {
  return fetchApi<OrderWithDecision>(
    `/v1/users/${user.id}/orders/${orderId}/reject`,
    new URLSearchParams(),
    {
      method: 'POST',
    },
  )
}

export async function approveOrderById(
  user: User,
  orderId: string,
  order: ApproveOrderReq,
) {
  return fetchApi<OrderWithDecision>(
    `/v1/users/${user.id}/orders/${orderId}/approve`,
    new URLSearchParams(),
    {
      method: 'POST',
      body: JSON.stringify(order),
    },
  )
}

// Follows

export async function followProfile(user: User) {
  return fetchApi(`/v1/users/${user.id}/follows`, new URLSearchParams(), {
    method: 'POST',
  })
}

export async function unfollowProfile(user: User) {
  return fetchApi(`/v1/users/${user.id}/follows`, new URLSearchParams(), {
    method: 'DELETE',
  })
}

// Collections

export async function fetchCreateCollection(
  user: User,
  collection: CreateCollectionReq,
) {
  return fetchApi<Collection>(
    `/v1/users/${user.id}/collections`,
    new URLSearchParams(),
    {
      method: 'POST',
      body: JSON.stringify(collection),
    },
  )
}

export async function fetchUpdateCollection(
  collectionId: string,
  collection: UpdateCollectionReq,
) {
  return fetchApi<Collection>(
    `/v1/collections/${collectionId}`,
    new URLSearchParams(),
    {
      method: 'PATCH',
      body: JSON.stringify(collection),
    },
  )
}

export async function fetchDeleteCollection(collectionId: string) {
  return fetchApi(`/v1/collections/${collectionId}`, new URLSearchParams(), {
    method: 'DELETE',
  })
}

export async function fetchAddCollectionItem(
  user: User,
  collectionId: string,
  req: AddItemToCollectionReq,
) {
  return fetchApi<CollectionItem>(
    `/v1/users/${user.id}/collections/${collectionId}/items`,
    new URLSearchParams(),
    {
      method: 'POST',
      body: JSON.stringify(req),
    },
  )
}

export async function fetchDeleteCollectionItem(
  collectionId: string,
  itemId: string,
) {
  return fetchApi(
    `/v1/collections/${collectionId}/items/${itemId}`,
    new URLSearchParams(),
    {
      method: 'DELETE',
    },
  )
}

export async function fetchCollectionItems(
  collectionId: string,
  page: number,
  size: number = 10,
) {
  const params = [
    ['page', page.toString()],
    ['size', size.toString()],
  ]
  return fetchApi<Paginated<CollectionItem>>(
    `/v1/collections/${collectionId}/items`,
    new URLSearchParams(params),
    {
      method: 'GET',
    },
  )
}

// Moderators

export async function fetchModeratorProfiles(user: User) {
  return fetchApi<Moderator[]>(
    `/v1/users/${user.id}/moderators`,
    new URLSearchParams(),
  )
}

export async function fetchAddModerator(user: User, username: string) {
  return fetchApi<Moderator>(
    `/v1/users/${user.id}/moderators`,
    new URLSearchParams(),
    {
      method: 'POST',
      body: JSON.stringify({ userLink: username }),
    },
  )
}

export async function fetchDeleteModerator(user: User, moderatorId: string) {
  return fetchApi<void>(
    `/v1/users/${user.id}/moderators/${moderatorId}`,
    new URLSearchParams(),
    {
      method: 'DELETE',
    },
  )
}

// Content Notes

export async function fetchProfileContentNotes<T extends DetailedContentNote>(
  user: User,
  category: ContentCategory,
  params: URLSearchParams,
) {
  return fetchApi<T[]>(`/v1/users/${user.id}/content-notes/${category}`, params)
}

export async function fetchContentNote<T extends ContentNote>(
  user: User,
  category: ContentCategory,
  noteId: string,
  coverSize: ImageSize = 'md',
) {
  const params = [['coverSize', coverSize]]
  return fetchApi<T>(
    `/v1/content-notes/${category}/${noteId}`,
    new URLSearchParams(params),
  )
}

export async function deleteContentNote(
  user: User,
  category: ContentCategory,
  noteId: string,
  resetApprovedOrders: boolean = true,
) {
  const params = [['resetApprovedOrders', resetApprovedOrders.toString()]]
  return fetchApi(
    `/v1/content-notes/${category}/${noteId}`,
    new URLSearchParams(params),
    {
      method: 'DELETE',
    },
  )
}

export async function updateContentNote<
  T extends ContentNote,
  R extends Partial<CreateContentNoteReq>,
>(user: User, category: ContentCategory, noteId: string, note: R) {
  return fetchApi<T>(
    `/v1/content-notes/${category}/${noteId}`,
    new URLSearchParams(),
    {
      method: 'PATCH',
      body: JSON.stringify(note),
    },
  )
}

export async function createContentNote<
  T extends ContentNote,
  R extends CreateContentNoteReq,
>(user: User, category: ContentCategory, note: R) {
  return fetchApi<T>(
    `/v1/users/${user.id}/content-notes/${category}`,
    new URLSearchParams(),
    {
      method: 'POST',
      body: JSON.stringify(note),
    },
  )
}

export async function fetchRenameContentNote(
  user: User,
  category: ContentCategory,
  id: string,
  name: string,
) {
  return fetchApi<void>(
    `/v1/users/${user.id}/content-notes/${category}/${id}/name`,
    new URLSearchParams(),
    {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    },
  )
}

export async function fetchContentNoteOrders(
  user: User,
  category: ContentCategory,
  noteId: string,
  page: number,
  size: number,
) {
  const params = [
    ['page', page.toString()],
    ['size', size.toString()],
  ]
  return fetchApi<Paginated<OrderWithDecision>>(
    `/v1/content-notes/${category}/${noteId}/orders`,
    new URLSearchParams(params),
  )
}

export async function fetchBatchContentNoteReactions(
  user: User,
  category: ContentCategory,
  noteIds: string[],
) {
  if (noteIds.length === 0) return []
  const params = [['contentNoteIds', noteIds.join(',')]]
  return fetchApi<ContentNoteReactions[]>(
    `/v1/users/${user.id}/content-notes/${category}/reactions`,
    new URLSearchParams(params),
  )
}

export async function createContentNoteReaction(
  user: User,
  category: ContentCategory,
  noteId: string,
  emote: string,
) {
  const body = {
    emoteId: emote,
    source: 'unicode_emoji',
  }
  return fetchApi(
    `/v1/users/${user.id}/content-notes/${category}/${noteId}/reactions`,
    new URLSearchParams(),
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export async function deleteContentNoteReaction(
  user: User,
  category: ContentCategory,
  noteId: string,
  emoteId: string,
) {
  const body = {
    emoteId: emoteId,
    source: 'unicode_emoji',
  }
  return fetchApi(
    `/v1/users/${user.id}/content-notes/${category}/${noteId}/reactions`,
    new URLSearchParams(),
    {
      method: 'DELETE',
      body: JSON.stringify(body),
    },
  )
}

// Games

export async function fetchContentSearch(
  category: ContentCategory,
  query: string,
  page: number,
  size: number,
  userId?: string,
  coverSize: ImageSize = 'sm',
  locale: string = 'en',
) {
  const params = [
    ['locale', locale],
    ['query', query],
    ['page', page.toString()],
    ['size', size.toString()],
    ['coverSize', coverSize],
  ]
  if (userId) params.push(['userId', userId])
  return fetchApi<Paginated<Content>>(
    `/v1/content/${category}`,
    new URLSearchParams(params),
  )
}

export async function fetchContentById(
  category: ContentCategory,
  id: string,
  coverSize: ImageSize = 'md',
  locale: string = 'en',
) {
  const params = [
    ['coverSize', coverSize],
    ['locale', locale],
  ]
  return fetchApi<DetailedGame | DetailedMovie>(
    `/v1/content/${category}/${id}`,
    new URLSearchParams(params),
  )
}
