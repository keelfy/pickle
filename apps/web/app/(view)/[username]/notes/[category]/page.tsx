'use client'

import { Button } from '@/components/ui/button'
import { getContentCategoryIcon } from '@/components/ui/content-category-icon'
import { ContentNoteGridSelectFilterOption } from '@/components/ui/content-note/content-note-grid-filters'
import ContentNoteSortFilterGrid, {
  ContentNoteGridSortOption,
} from '@/components/ui/content-note/content-note-sort-filter-grid'
import GameNoteCard from '@/components/ui/content-note/game-note-card'
import MovieNoteCard from '@/components/ui/content-note/movie-note-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { localizeContentCategory } from '@/lib/localize-types'
import {
  ContentCategory,
  GLOBALLY_DISABLED_CONTENT_CATEGORIES,
  VISIBLE_CONTENT_CATEGORIES,
} from '@/lib/model/content'
import { DetailedGameNote, DetailedMovieNote } from '@/lib/model/content-note'
import { useMediaQuery } from '@/lib/use-media-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const getGamesCursorValue = (
  item: DetailedGameNote,
  column: string,
): string => {
  switch (column) {
    case 'created_at':
      return item.createdAt
    case 'last_played_at':
      return item.lastPlayedAt ?? ''
    case 'title':
      return item.content?.title ?? ''
    case 'rate':
      return item.rate?.toString() || ''
    default:
      return ''
  }
}

const getMoviesCursorValue = (
  item: DetailedMovieNote,
  column: string,
): string => {
  switch (column) {
    case 'created_at':
      return item.createdAt
    case 'watched_at':
      return item.watchedAt ?? ''
    case 'title':
      return item.content?.title ?? ''
    case 'rate':
      return item.rate?.toString() || ''
    default:
      return ''
  }
}

const getCursorValue = <T extends DetailedGameNote | DetailedMovieNote>(
  category: ContentCategory,
  item: T,
  column: string,
): string => {
  if (category === 'games') {
    return getGamesCursorValue(item as DetailedGameNote, column)
  } else if (category === 'movies') {
    return getMoviesCursorValue(item as DetailedMovieNote, column)
  }
  return ''
}

const GAMES_SORT_OPTIONS: ContentNoteGridSortOption[] = [
  {
    label: 'Newest',
    value: 'created_at.desc',
  },
  {
    label: 'Oldest',
    value: 'created_at.asc',
  },
  {
    label: 'Recently Played',
    value: 'last_played_at.desc',
  },
  {
    label: 'Best Rated',
    value: 'rate.desc',
  },
  {
    label: 'Worst Rated',
    value: 'rate.asc',
  },
]

const MOVIES_SORT_OPTIONS: ContentNoteGridSortOption[] = [
  {
    label: 'Newest',
    value: 'created_at.desc',
  },
  {
    label: 'Oldest',
    value: 'created_at.asc',
  },
  {
    label: 'Recently Watched',
    value: 'watched_at.desc',
  },
  {
    label: 'Best Rated',
    value: 'rate.desc',
  },
  {
    label: 'Worst Rated',
    value: 'rate.asc',
  },
  // {
  //     label: "Name A-Z",
  //     value: "title.asc",
  // },
  // {
  //     label: "Name Z-A",
  //     value: "title.desc",
  // },
]

const SORT_OPTIONS: Record<ContentCategory, ContentNoteGridSortOption[]> = {
  games: GAMES_SORT_OPTIONS,
  movies: MOVIES_SORT_OPTIONS,
  anime: [],
  series: [],
  videos: [],
  custom: [],
  any: [],
}

const GAMES_STATUS_FILTER_OPTIONS: ContentNoteGridSelectFilterOption[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'playing', label: 'Playing' },
  { value: 'paused', label: 'Paused' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'finished', label: 'Finished' },
  { value: 'dropped', label: 'Dropped' },
]

const MOVIES_STATUS_FILTER_OPTIONS: ContentNoteGridSelectFilterOption[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'watched', label: 'Watched' },
  { value: 'dropped', label: 'Dropped' },
]

const STATUS_FILTER_OPTIONS: Record<
  ContentCategory,
  ContentNoteGridSelectFilterOption[]
> = {
  games: GAMES_STATUS_FILTER_OPTIONS,
  movies: MOVIES_STATUS_FILTER_OPTIONS,
  anime: [],
  series: [],
  videos: [],
  custom: [],
  any: [],
}

export default function ContentNoteGridPage() {
  const { category, username } = useParams<{
    category: ContentCategory
    username: string
  }>()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const router = useRouter()
  return (
    <div className="flex flex-col justify-center gap-8 md:items-start md:justify-start">
      <ContentNoteSortFilterGrid<DetailedGameNote | DetailedMovieNote>
        category={category}
        sortOptions={SORT_OPTIONS[category]}
        getCursorValue={(item, column) =>
          getCursorValue(category, item, column)
        }
        getContentNoteCard={(note, defaultReactions) => {
          if (category === 'games') {
            return (
              <GameNoteCard
                note={note as DetailedGameNote}
                defaultReactions={defaultReactions}
              />
            )
          } else if (category === 'movies') {
            return (
              <MovieNoteCard
                note={note as DetailedMovieNote}
                defaultReactions={defaultReactions}
              />
            )
          }
        }}
        filtering={{
          statusOptions: STATUS_FILTER_OPTIONS[category],
        }}
        header={
          isDesktop ? (
            <div className="flex items-center gap-2">
              {VISIBLE_CONTENT_CATEGORIES.map((cat) => {
                const Icon = getContentCategoryIcon(cat)
                const disabled =
                  GLOBALLY_DISABLED_CONTENT_CATEGORIES.includes(cat)
                return (
                  <Button
                    key={cat}
                    variant={cat === category ? 'default' : 'secondary'}
                    disabled={disabled}
                    className="flex items-center gap-2"
                    asChild
                  >
                    <Link
                      href={`/${username}/notes/${cat}`}
                      className={
                        disabled ? 'pointer-events-none opacity-50' : ''
                      }
                    >
                      <Icon className="size-3" />
                      {localizeContentCategory(cat, true)}
                    </Link>
                  </Button>
                )
              })}
            </div>
          ) : (
            <Select
              value={category}
              onValueChange={(value) => {
                router.push(`/${username}/notes/${value}`)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {VISIBLE_CONTENT_CATEGORIES.map((category) => {
                  const Icon = getContentCategoryIcon(category)
                  return (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-3" />
                        {localizeContentCategory(category, true)}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )
        }
      />
    </div>
  )
}
