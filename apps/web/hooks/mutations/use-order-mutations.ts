'use client'

import { DetailedOrder, OrderWithDecision } from '@/lib/model/order'
import { Profile, User } from '@/lib/model/user'
import { queryKeys } from '@/lib/query-keys'
import { ApproveOrderReq, SuggestContentReq } from '@/utils/api/request'
import { fetchApi } from '@/utils/api/client'
import { useMutation, useQuery } from '@tanstack/react-query'

export function useOrderDetail(profile?: Profile, orderId?: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId ?? ''),
    queryFn: () =>
      fetchApi<DetailedOrder>(
        `/v1/users/${profile!.id}/orders/${orderId}`,
        new URLSearchParams(),
      ),
    enabled: Boolean(profile?.id && orderId),
  })
}

export function useSuggestContentMutation() {
  return useMutation({
    mutationFn: ({ user, order }: { user: User; order: SuggestContentReq }) =>
      fetchApi<DetailedOrder>(
        `/v1/users/${user.id}/orders/suggest`,
        new URLSearchParams(),
        {
          method: 'POST',
          body: JSON.stringify(order),
        },
      ),
  })
}

export function useRejectOrderMutation() {
  return useMutation({
    mutationFn: ({ user, orderId }: { user: User; orderId: string }) =>
      fetchApi<OrderWithDecision>(
        `/v1/users/${user.id}/orders/${orderId}/reject`,
        new URLSearchParams(),
        {
          method: 'POST',
        },
      ),
  })
}

export function useApproveOrderMutation() {
  return useMutation({
    mutationFn: ({
      user,
      orderId,
      order,
    }: {
      user: User
      orderId: string
      order: ApproveOrderReq
    }) =>
      fetchApi<OrderWithDecision>(
        `/v1/users/${user.id}/orders/${orderId}/approve`,
        new URLSearchParams(),
        {
          method: 'POST',
          body: JSON.stringify(order),
        },
      ),
  })
}
