import {
  Content,
  DetailedContent,
  DetailedGame,
  DetailedMovie,
  Game,
  Movie,
} from './content'
import { Orderer } from './orderer'

export interface ContentNote {
  id: string
  userId: string
  content?: Content
}

export type DetailedContentNote = ContentNote & {
  createdAt: string
  rate?: number
  comment: string
  ordererCount: number
  status: ContentNoteStatus
  initialOrderer?: Orderer
  content?: DetailedContent
}

export type GameNoteStatus =
  | 'planned'
  | 'playing'
  | 'paused'
  | 'dropped'
  | 'finished'
  | 'skipped'

export type MovieNoteStatus = 'planned' | 'dropped' | 'watched' | 'skipped'

export type ContentNoteStatus = GameNoteStatus | MovieNoteStatus

export type GameNoteAdditions = {
  lastPlayedAt?: string
}

export type MovieNoteAdditions = {
  watchedAt?: string
}

export type GameNote = ContentNote & {
  content?: Game
}

export type MovieNote = ContentNote & {
  content?: Movie
}

export type DetailedGameNote = DetailedContentNote &
  GameNoteAdditions & {
    content?: DetailedGame
  }

export type DetailedMovieNote = DetailedContentNote &
  MovieNoteAdditions & {
    content?: DetailedMovie
  }
