'use client'

import LoadingSpinner from '@/components/ui/loading-spinner'
import { fetchProfileOrders } from '@/hooks/api-endpoints-client'
import { toastError } from '@/lib/toasts'
import { OrderWithDecision } from '@/lib/model/order'
import { useSortFilterFetch } from '@/lib/sort-filter-fetch'
import { useProfileStore } from '@/providers/profile-store'
import { Filter } from '@/query-params/filter'
import SuggestionListEntry from './suggestion-list-entry'

type Props = {
  sort: string
  filters: Filter[]
}

const getOrdersCursorValue = (
  item: OrderWithDecision,
  column: string,
): string => {
  switch (column) {
    case 'created_at':
      return item.createdAt
    default:
      return ''
  }
}

export default function SuggestionList({ sort, filters }: Props) {
  const { profile } = useProfileStore((state) => state)

  const { contents, viewRef, isLoading } =
    useSortFilterFetch<OrderWithDecision>({
      sort,
      filters,
      isInitialized: true,
      fetchFunction: async (params) => {
        if (!profile) return []
        try {
          return await fetchProfileOrders(profile, params)
        } catch (error) {
          toastError('Failed to fetch orders', error)
          throw error
        }
      },
      getCursorValue: getOrdersCursorValue,
    })

  return (
    <>
      <div className="grid gap-4">
        {contents.map((order) => (
          <SuggestionListEntry key={order.id} order={order} />
        ))}
        {contents.length === 0 && !isLoading && (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No orders found.</p>
          </div>
        )}
      </div>
      <div
        ref={viewRef}
        className="flex h-10 w-full items-center justify-center"
      >
        {isLoading && <LoadingSpinner type="bars" />}
      </div>
    </>
  )
}
