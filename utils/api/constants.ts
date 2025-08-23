import { ContentCategory } from '@/lib/model/content'
import { GameNoteStatus, MovieNoteStatus } from '@/lib/model/content-note'

export type ApiType<T extends string> = {
  value: T
  label: string
}

export const contentCategoryLabels: ApiType<ContentCategory>[] = [
  { value: 'games', label: 'Game' },
  { value: 'anime', label: 'Anime' },
  { value: 'movies', label: 'Movie' },
  { value: 'series', label: 'Series' },
  { value: 'videos', label: 'Videos' },
]

export const gameNoteStatusLabels: ApiType<GameNoteStatus>[] = [
  { value: 'playing', label: 'Playing' },
  { value: 'paused', label: 'Paused' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'finished', label: 'Finished' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'planned', label: 'Planned' },
]

export const movieNoteStatusLabels: ApiType<MovieNoteStatus>[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'watched', label: 'Watched' },
  { value: 'skipped', label: 'Skipped' },
]
