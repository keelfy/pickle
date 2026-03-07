export enum ContentCategoryEnum {
  Games = 'games',
  Movies = 'movies',
  Anime = 'anime',
  Series = 'series',
  Videos = 'videos',
  Custom = 'custom',
  Any = 'any',
}

export type ContentCategory = `${ContentCategoryEnum}`

export const CONTENT_CATEGORIES: ContentCategory[] =
  Object.values(ContentCategoryEnum)

export const VISIBLE_CONTENT_CATEGORIES: ContentCategory[] = [
  ContentCategoryEnum.Games,
  ContentCategoryEnum.Movies,
  ContentCategoryEnum.Anime,
  ContentCategoryEnum.Series,
  ContentCategoryEnum.Videos,
]

export const GLOBALLY_DISABLED_CONTENT_CATEGORIES: ContentCategory[] = [
  ContentCategoryEnum.Anime,
  ContentCategoryEnum.Series,
  ContentCategoryEnum.Videos,
]

export type ContentWebsite = {
  url: string
  type: string
}

export type Content = {
  id: string
  title: string
  category: ContentCategory
  coverUrl?: string
}

export type UserContent = Content & {
  noteId?: string
}

export type DetailedContent = Content & {
  sourceUrl?: string
  sourceType: string
  websites: ContentWebsite[]
}

export type GameAdditions = {
  releaseDate?: Date
}

export type Game = Content & GameAdditions

export type DetailedGame = DetailedContent & GameAdditions

export type MovieAdditions = {
  releaseDate?: Date
}

export type Movie = Content & MovieAdditions

export type DetailedMovie = DetailedContent & MovieAdditions
