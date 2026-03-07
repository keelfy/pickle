'use client'

import { Collection, CollectionItem } from '@/lib/model/collection'
import { User } from '@/lib/model/user'
import { queryKeys } from '@/lib/query-keys'
import {
  AddItemToCollectionReq,
  CreateCollectionReq,
  UpdateCollectionReq,
} from '@/utils/api/request'
import { fetchApi } from '@/utils/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateCollectionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ user, data }: { user: User; data: CreateCollectionReq }) =>
      fetchApi<Collection>(
        `/v1/users/${user.id}/collections`,
        new URLSearchParams(),
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.collections.list(variables.user.id),
      })
    },
  })
}

export function useUpdateCollectionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      collectionId,
      data,
    }: {
      collectionId: string
      data: UpdateCollectionReq
    }) =>
      fetchApi<Collection>(
        `/v1/collections/${collectionId}`,
        new URLSearchParams(),
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
      ),
    onSuccess: (updatedCollection: Collection) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.collections.detail(updatedCollection.id),
      })
    },
  })
}

export function useDeleteCollectionMutation() {
  return useMutation({
    mutationFn: ({ collectionId }: { collectionId: string }) =>
      fetchApi<void>(`/v1/collections/${collectionId}`, new URLSearchParams(), {
        method: 'DELETE',
      }),
  })
}

export function useDeleteCollectionItemMutation() {
  return useMutation({
    mutationFn: ({
      collectionId,
      itemId,
    }: {
      collectionId: string
      itemId: string
    }) =>
      fetchApi<void>(
        `/v1/collections/${collectionId}/items/${itemId}`,
        new URLSearchParams(),
        {
          method: 'DELETE',
        },
      ),
  })
}

export function useAddCollectionItemMutation() {
  return useMutation({
    mutationFn: ({
      user,
      collectionId,
      req,
    }: {
      user: User
      collectionId: string
      req: AddItemToCollectionReq
    }) =>
      fetchApi<CollectionItem>(
        `/v1/users/${user.id}/collections/${collectionId}/items`,
        new URLSearchParams(),
        {
          method: 'POST',
          body: JSON.stringify(req),
        },
      ),
  })
}
