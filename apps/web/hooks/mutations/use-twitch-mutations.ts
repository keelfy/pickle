'use client'

import { fetchApi } from '@/utils/api/client'
import {
  BroadcasterPreferencesReq,
  TrackedRewardReq,
} from '@/utils/api/request'
import { BroadcasterPreferences } from '@/utils/api/types'
import { useMutation, useQuery } from '@tanstack/react-query'

export function useTwitchPreferences() {
  return useQuery({
    queryKey: ['twitch', 'preferences'],
    queryFn: () =>
      fetchApi<BroadcasterPreferences>('/twitch-harbor/v1/broadcaster/preferences'),
  })
}

export function useSaveTwitchPreferencesMutation() {
  return useMutation({
    mutationFn: (trackedRewards: TrackedRewardReq[]) => {
      const req: BroadcasterPreferencesReq = {
        rewards: {
          trackedRewards,
        },
      }
      return fetchApi(`/twitch-harbor/v1/broadcaster/preferences`, undefined, {
        method: 'POST',
        body: JSON.stringify(req),
      })
    },
  })
}

export function useImportRedemptionsMutation() {
  return useMutation({
    mutationFn: () =>
      fetchApi(
        `/twitch-harbor/v1/broadcaster/rewards/fetch-redemptions`,
        new URLSearchParams(),
        {
          method: 'POST',
        },
      ),
  })
}
