import { ContentCategory, ContentCategoryEnum } from '@/lib/model/content'
import { ContentNoteStatus } from './model/content-note'

export const getContentCategoryMessageKey = (
  category: ContentCategory,
  plural: boolean = false,
) => {
  switch (category) {
    case ContentCategoryEnum.Games:
      return plural ? 'contentCategory.games.plural' : 'contentCategory.games.one'
    case ContentCategoryEnum.Videos:
      return plural
        ? 'contentCategory.videos.plural'
        : 'contentCategory.videos.one'
    case ContentCategoryEnum.Movies:
      return plural
        ? 'contentCategory.movies.plural'
        : 'contentCategory.movies.one'
    case ContentCategoryEnum.Series:
      return plural
        ? 'contentCategory.series.plural'
        : 'contentCategory.series.one'
    case ContentCategoryEnum.Anime:
      return plural ? 'contentCategory.anime.plural' : 'contentCategory.anime.one'
    default:
      return plural
        ? 'contentCategory.content.plural'
        : 'contentCategory.content.one'
  }
}

export const localizeContentCategory = (
  category: ContentCategory,
  plural: boolean = false,
) => {
  switch (category) {
    case ContentCategoryEnum.Games:
      return plural ? 'Games' : 'Game'
    case ContentCategoryEnum.Videos:
      return plural ? 'Videos' : 'Video'
    case ContentCategoryEnum.Movies:
      return plural ? 'Movies' : 'Movie'
    case ContentCategoryEnum.Series:
      return plural ? 'Series' : 'Series'
    case ContentCategoryEnum.Anime:
      return plural ? 'Anime' : 'Anime'
    default:
      return plural ? 'Content' : 'Content'
  }
}

export const getContentNoteStatusMessageKey = (
  status: ContentNoteStatus | undefined,
) => {
  switch (status) {
    case 'playing':
      return 'contentNoteStatus.playing'
    case 'paused':
      return 'contentNoteStatus.paused'
    case 'dropped':
      return 'contentNoteStatus.dropped'
    case 'finished':
      return 'contentNoteStatus.finished'
    case 'watched':
      return 'contentNoteStatus.watched'
    case 'skipped':
      return 'contentNoteStatus.skipped'
    case 'planned':
      return 'contentNoteStatus.planned'
    default:
      return 'contentNoteStatus.unknown'
  }
}

export const localizeContentNoteStatus = (
  status: ContentNoteStatus | undefined,
) => {
  switch (status) {
    case 'playing':
      return 'Playing'
    case 'paused':
      return 'Paused'
    case 'dropped':
      return 'Dropped'
    case 'finished':
      return 'Finished'
    case 'watched':
      return 'Watched'
    case 'skipped':
      return 'Skipped'
    case 'planned':
      return 'Planned'
    default:
      return 'Unknown'
  }
}

export const getOrderSourceMessageKey = (source: string) => {
  switch (source) {
    case 'pickle-suggestion':
      return 'orderSource.pickle'
    case 'twitch-channel-points':
      return 'orderSource.twitch'
    default:
      return 'orderSource.unknown'
  }
}

export const localizeOrderSource = (source: string) => {
  switch (source) {
    case 'pickle-suggestion':
      return 'Pickle'
    case 'twitch-channel-points':
      return 'Twitch'
    default:
      return 'Unknown'
  }
}

export const getTimeAgoText = (date: Date) => {
  const diff = new Date().getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`
  }

  if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`
  }

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`
  }

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  return `${seconds} second${seconds > 1 ? 's' : ''}`
}
