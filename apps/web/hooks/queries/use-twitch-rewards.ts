'use client'

import { queryKeys } from '@/lib/query-keys'
import { fetchApi } from '@/utils/api/client'
import { TwitchChannelReward } from '@/utils/api/types'
import { useQuery } from '@tanstack/react-query'

export function useTwitchRewards() {
  return useQuery({
    queryKey: queryKeys.twitch.rewards(),
    queryFn: () =>
      fetchApi<TwitchChannelReward[]>(
        `/twitch-harbor/v1/broadcaster/rewards/available`,
      ),
  })
}
