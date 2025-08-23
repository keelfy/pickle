import { Collection } from '@/lib/model/collection'
import { ContentCategory } from '@/lib/model/content'
import { ProfileLink } from '@/lib/model/user'

export type SuggestionPreferencesReq = {
  enabled: boolean
  allowedFree: boolean
  allowedAnonymously: boolean
  categories: ContentCategory[]
}

export type UpdateProfileReq = {
  displayName: string
  username: string
  description: string
  socialLinks: ProfileLink[]
  suggestionPreferences: SuggestionPreferencesReq
}

export type GameNoteReq = {
  status: string
  rate?: number
  comment?: string
  contentId: string
}

export type CreateContentNoteReq = {
  status: string
  rate?: number
  comment?: string
  contentId: string
}

export type CreateGameNoteReq = CreateContentNoteReq & {
  lastPlayedAt?: Date
}

export type CreateMovieNoteReq = CreateContentNoteReq & {
  watchedAt?: Date
}

export type CreateCollectionReq = {
  name: string
}

export type UpdateCollectionReq = Partial<Collection>

export type AddItemToCollectionReq = {
  itemId: string
  category: ContentCategory
}

export type SuggestContentReq = {
  ordererUsername: string
  isAnonymously: boolean
  category: ContentCategory
  message: string
  contentId?: string
}

export type ApproveOrderReq = {
  category: ContentCategory
  contentId: string
}

export type TrackedRewardReq = {
  rewardId: string
  category: ContentCategory | 'any'
}

export type BroadcasterPreferencesReq = {
  rewards: {
    trackedRewards: TrackedRewardReq[]
  }
}
