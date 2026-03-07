import { ContentCategory } from './content'
import { ContentNote } from './content-note'
import { Orderer } from './orderer'
import { User } from './user'

export type Order = {
  id: string
  createdAt: string
  source: string
  anonymous: boolean
  orderer?: Orderer
}

export type DetailedOrder = Order & {
  category: ContentCategory
  message: string
}

export type OrderWithDecision = DetailedOrder & {
  decision?: OrderDecision
}

export type OrderDecisionStatus = 'approved' | 'rejected'

export type OrderDecision = {
  contentNote?: ContentNote
  decidedAt: string
  decidedBy?: User
  status: OrderDecisionStatus
}
