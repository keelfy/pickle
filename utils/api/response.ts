export type SearchHit<T> = {
  id: string
  source: T
  score: number
}

export type Paginated<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type LinkValidation = {
  valid: boolean
  message: string
}
