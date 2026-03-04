import { ContentCategory } from '@/lib/model/content'
import { ImageSize } from '@/lib/model/types'
import { Filter } from '@/query-params/filter'

export const queryKeys = {
  users: {
    me: () => ['users', 'me'] as const,
    avatar: (size: ImageSize = 'md') => ['users', 'avatar', size] as const,
    validateUsername: (username: string) =>
      ['users', 'validate-username', username] as const,
  },
  profiles: {
    byUsername: (username: string) => ['profiles', username] as const,
    follows: (userId: string) => ['profiles', userId, 'follows'] as const,
    contentSearch: (
      profileId: string,
      query: string,
      page: number,
      size: number,
    ) => ['profiles', profileId, 'content-search', query, page, size] as const,
  },
  contentNotes: {
    list: (
      userId: string,
      category: ContentCategory,
      filters: Filter[],
      sort: string,
    ) => ['content-notes', userId, category, { filters, sort }] as const,
    detail: (userId: string, category: ContentCategory, noteId: string) =>
      ['content-notes', userId, category, noteId] as const,
    orders: (
      userId: string,
      category: ContentCategory,
      noteId: string,
      page: number,
      size: number,
    ) => ['content-notes', userId, category, noteId, 'orders', page, size] as const,
    reactions: (noteId: string) => ['content-notes', 'reactions', noteId] as const,
    batchReactions: (category: ContentCategory, noteIds: string[]) =>
      ['content-notes', 'reactions', 'batch', category, noteIds] as const,
  },
  collections: {
    list: (userId: string) => ['collections', userId] as const,
    detail: (collectionId: string) =>
      ['collections', 'detail', collectionId] as const,
    items: (collectionId: string, page: number, size: number) =>
      ['collections', collectionId, 'items', page, size] as const,
  },
  moderators: {
    list: (userId: string) => ['moderators', userId] as const,
  },
  orders: {
    list: (userId: string, sort: string, filters: Filter[]) =>
      ['orders', userId, { sort, filters }] as const,
    detail: (orderId: string) => ['orders', 'detail', orderId] as const,
  },
  content: {
    search: (
      category: ContentCategory,
      query: string,
      page: number,
      size: number,
      userId?: string,
    ) => ['content', 'search', category, query, page, size, userId] as const,
    detail: (category: ContentCategory, contentId: string) =>
      ['content', category, contentId] as const,
  },
  twitch: {
    rewards: () => ['twitch', 'rewards'] as const,
  },
} as const
