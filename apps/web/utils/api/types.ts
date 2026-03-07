import { ContentCategory } from '@/lib/model/content'

export type TwitchChannelReward = {
  id: string
  title: string
  prompt: string
  backgroundColor: string
  image: string
  cost: number
  isEnabled: boolean
  isPaused: boolean
  isInStock: boolean
  isUserInputRequired: boolean
  category: ContentCategory | undefined
}

export type BroadcasterRewardPreferences = {
  isActive: boolean
  trackedRewards: TwitchChannelReward[]
  availableRewards: TwitchChannelReward[] | undefined
}

export type BroadcasterPreferences = {
  rewards: BroadcasterRewardPreferences
}
