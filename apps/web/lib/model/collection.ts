import { Content } from './content'
import { Paginated } from './types'

export type Collection = {
  id: string
  createdAt: Date
  name: string
}

export type CollectionItem = {
  id: string
  createdAt: Date
  collectionId: string
  content: Content
}

export type BatchCollectionItems = Paginated<CollectionItem> & {
  collectionId: string
}
