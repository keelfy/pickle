import { ContentCategory } from './content'

export type ProfileLink = {
  id: string
  name: string
  url: string
  position: number
}

export type SuggestionPreferences = {
  enabled: boolean
  allowedFree: boolean
  allowedAnonymously: boolean
  categories: ContentCategory[]
}

export type User = {
  id: string
  displayName: string
  avatarUrl: string
  username: string
}

export type UserContext = {
  isFollowing: boolean
  isAuthorized: boolean
  isModerator: boolean
}

export type DetailedUser = User & {
  description: string
  socialLinks: ProfileLink[]
  suggestionPreferences: SuggestionPreferences
  context: UserContext
}

export type UsernameValidation = {
  valid: boolean
  message: string
}

export type UserAvatar = {
  url: string
}

export type ProfileCounts = {
  played: number
  watched: number
  ordered: number
  followers: number
}

export type Profile = DetailedUser & {
  createdAt: Date
  counts: ProfileCounts
}
