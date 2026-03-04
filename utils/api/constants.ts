import { ContentCategory } from '@/lib/model/content'
import { GameNoteStatus, MovieNoteStatus } from '@/lib/model/content-note'

export type ApiType<T extends string> = {
  value: T
  label: string
  messageKey?: string
}

export const contentCategoryLabels: ApiType<ContentCategory>[] = [
  { value: 'games', label: 'Game', messageKey: 'contentCategory.games.one' },
  { value: 'anime', label: 'Anime', messageKey: 'contentCategory.anime.one' },
  { value: 'movies', label: 'Movie', messageKey: 'contentCategory.movies.one' },
  { value: 'series', label: 'Series', messageKey: 'contentCategory.series.one' },
  {
    value: 'videos',
    label: 'Videos',
    messageKey: 'contentCategory.videos.plural',
  },
]

export const gameNoteStatusLabels: ApiType<GameNoteStatus>[] = [
  { value: 'playing', label: 'Playing', messageKey: 'contentNoteStatus.playing' },
  { value: 'paused', label: 'Paused', messageKey: 'contentNoteStatus.paused' },
  { value: 'dropped', label: 'Dropped', messageKey: 'contentNoteStatus.dropped' },
  {
    value: 'finished',
    label: 'Finished',
    messageKey: 'contentNoteStatus.finished',
  },
  { value: 'skipped', label: 'Skipped', messageKey: 'contentNoteStatus.skipped' },
  { value: 'planned', label: 'Planned', messageKey: 'contentNoteStatus.planned' },
]

export const movieNoteStatusLabels: ApiType<MovieNoteStatus>[] = [
  { value: 'planned', label: 'Planned', messageKey: 'contentNoteStatus.planned' },
  { value: 'dropped', label: 'Dropped', messageKey: 'contentNoteStatus.dropped' },
  { value: 'watched', label: 'Watched', messageKey: 'contentNoteStatus.watched' },
  { value: 'skipped', label: 'Skipped', messageKey: 'contentNoteStatus.skipped' },
]
