'use client'

import { queryKeys } from '@/lib/query-keys'
import {
  BatchCollectionItems,
  Collection,
  CollectionItem,
} from '@/lib/model/collection'
import { useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/utils/api/client'
import { Paginated } from '@/utils/api/response'
import React, { createContext } from 'react'

type CollectionState = Paginated<CollectionItem> & {
  collection: Collection
}

type CollectionContextType = {
  states: CollectionState[]
  addCollection: (newCollection: Collection) => void
  deleteCollection: (collectionId: string) => void
  updateCollection: (id: string, collection: Collection) => void
  addItemToCollection: (collectionId: string, item: CollectionItem) => void
  deleteItemFromCollection: (collectionId: string, itemId: string) => void
  updateItemInCollection: (
    collectionId: string,
    itemId: string,
    item: CollectionItem,
  ) => void
  loadMoreItems: (collectionId: string) => Promise<void>
}

export const CollectionsContext = createContext<CollectionContextType>({
  states: [],
  addCollection: () => {},
  deleteCollection: () => {},
  addItemToCollection: () => {},
  deleteItemFromCollection: () => {},
  updateCollection: () => {},
  updateItemInCollection: () => {},
  loadMoreItems: () => Promise.resolve(),
})

type CollectionsProviderProps = {
  collections: Collection[]
  itemBatches: BatchCollectionItems[]
}

export const CollectionsProvider = ({
  children,
  collections,
  itemBatches,
}: React.PropsWithChildren<CollectionsProviderProps>) => {
  const queryClient = useQueryClient()
  const defaultCollectionContext = collections.map((collection) => {
    const itemsBatch = itemBatches.find(
      (item) => item.collectionId === collection.id,
    )
    return {
      collection,
      content: itemsBatch?.content ?? [],
      page: itemsBatch?.page ?? 0,
      size: itemsBatch?.size ?? 10,
      totalElements: itemsBatch?.totalElements ?? 0,
      totalPages: itemsBatch?.totalPages ?? 0,
    }
  })

  const [collectionsState, setCollectionsState] = React.useState<
    CollectionState[]
  >(defaultCollectionContext)

  const addCollection = React.useCallback((newCollection: Collection) => {
    setCollectionsState((prev) => [
      ...prev,
      {
        collection: newCollection,
        content: [],
        page: 0,
        size: 0,
        totalElements: 0,
        totalPages: 0,
      },
    ])
  }, [])

  const deleteCollection = React.useCallback((collectionId: string) => {
    setCollectionsState((prev) =>
      prev.filter((collection) => collection.collection.id !== collectionId),
    )
  }, [])

  const addItemToCollection = React.useCallback(
    (collectionId: string, item: CollectionItem) => {
      setCollectionsState((prev) =>
        prev.map((collection) =>
          collection.collection.id === collectionId
            ? {
                ...collection,
                content: [item, ...collection.content],
                totalElements: collection.totalElements + 1,
              }
            : collection,
        ),
      )
    },
    [],
  )

  const deleteItemFromCollection = React.useCallback(
    (collectionId: string, itemId: string) => {
      setCollectionsState((prev) =>
        prev.map((collection) =>
          collection.collection.id === collectionId
            ? {
                ...collection,
                content: collection.content.filter(
                  (item) => item.id !== itemId,
                ),
                totalElements: collection.totalElements - 1,
              }
            : collection,
        ),
      )
    },
    [],
  )

  const updateCollection = React.useCallback(
    (id: string, collection: Collection) => {
      setCollectionsState((prev) =>
        prev.map((c) =>
          c.collection.id === id
            ? {
                ...c,
                collection,
              }
            : c,
        ),
      )
    },
    [],
  )

  const updateItemInCollection = React.useCallback(
    (collectionId: string, itemId: string, item: CollectionItem) => {
      setCollectionsState((prev) =>
        prev.map((c) =>
          c.collection.id === collectionId
            ? {
                ...c,
                content: c.content.map((i) => (i.id === itemId ? item : i)),
              }
            : c,
        ),
      )
    },
    [],
  )

  const loadMoreItems = React.useCallback(
    async (collectionId: string) => {
      const collectionState = collectionsState.find(
        (c) => c.collection.id === collectionId,
      )
      if (!collectionState) return
      const nextPage = collectionState.page + 1
      const paginatedItems = await queryClient.fetchQuery({
        queryKey: queryKeys.collections.items(
          collectionId,
          nextPage,
          collectionState.size,
        ),
        queryFn: () =>
          fetchApi<Paginated<CollectionItem>>(
            `/v1/collections/${collectionId}/items`,
            new URLSearchParams([
              ['page', nextPage.toString()],
              ['size', collectionState.size.toString()],
            ]),
            { method: 'GET' },
          ),
      })
      setCollectionsState((prev) =>
        prev.map((c) =>
          c.collection.id === collectionId
            ? {
                ...c,
                content: [...c.content, ...paginatedItems.content],
                page: paginatedItems.page,
                totalElements: paginatedItems.totalElements,
                totalPages: paginatedItems.totalPages,
              }
            : c,
        ),
      )
    },
    [collectionsState, queryClient],
  )

  return (
    <CollectionsContext.Provider
      value={{
        states: collectionsState,
        addCollection,
        deleteCollection,
        addItemToCollection,
        deleteItemFromCollection,
        updateCollection,
        updateItemInCollection,
        loadMoreItems,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  )
}

export const useCollectionContext = () => {
  const collections = React.useContext(CollectionsContext)
  if (!collections) {
    throw new Error(
      'useCollectionContext must be used within a CollectionsProvider',
    )
  }
  return collections
}
