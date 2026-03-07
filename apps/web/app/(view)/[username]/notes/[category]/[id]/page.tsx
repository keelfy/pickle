import {
  ContentCategory,
  ContentCategoryEnum,
} from '@/lib/model/content'
import { createQueryClient } from '@/lib/query-client'
import { profileByUsernameQueryOptions } from '@/lib/query-options'
import { DetailedContentNote } from '@/lib/model/content-note'
import { categoryToSchemaType } from '@/lib/schema-org'
import { Profile } from '@/lib/model/user'
import { getSiteUrl } from '@/lib/site-url'
import { fetchApi } from '@/utils/api/server'
import { ModalType } from '@/stores/modal'
import { Metadata } from 'next'
import RedirectToNoteModal from './redirect-to-note-modal'

type Params = {
  username: string
  category: string
  id: string
}

type Props = {
  params: Promise<Params>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, id, username } = await params
  const queryClient = createQueryClient()

  const [profile, note] = await Promise.all([
    queryClient
      .fetchQuery(profileByUsernameQueryOptions(fetchApi, username, 'lg'))
      .catch(() => null),
    queryClient
      .fetchQuery({
        queryKey: ['content-notes', 'public', category, id, 'md'],
        queryFn: () =>
          fetchApi<DetailedContentNote>(
            `/v1/content-notes/${category as ContentCategory}/${id}`,
            new URLSearchParams([['coverSize', 'md']]),
          ),
      })
      .catch(() => null),
  ])

  if (!profile) {
    return {
      title: '404 Profile not found - pickle',
      description: '404 Profile not found - pickle',
    }
  }

  if (!note?.content) {
    return {
      title: '404 Content note not found - pickle',
      description: '404 Content note not found - pickle',
    }
  }

  const title = `${note.content?.title ?? ''} - ${profile.displayName}`
  const description =
    note.comment && note.comment.trim().length > 0
      ? note.comment.slice(0, 160)
      : `Thoughts of ${profile.displayName} on ${note.content?.title ?? ''}`
  return {
    title,
    description,
    alternates: {
      canonical: `/${username}/notes/${category}/${id}`,
    },
    openGraph: {
      title,
      description,
      images: note.content.coverUrl ? [note.content.coverUrl] : undefined,
      type: 'article',
      url: `${getSiteUrl()}/${username}/notes/${category}/${id}`,
      authors: [profile.displayName],
      publishedTime: note.createdAt,
    },
    twitter: {
      card: note.content.coverUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: note.content.coverUrl ? [note.content.coverUrl] : undefined,
    },
  }
}

const CATEGORY_MODAL_TYPE_MAP = {
  [ContentCategoryEnum.Movies]: ModalType.MovieNote,
  [ContentCategoryEnum.Games]: ModalType.GameNote,
} as const

export default async function ContentNotePage({ params }: Props) {
  const { category, id, username } = await params
  const queryClient = createQueryClient()

  const modalType =
    CATEGORY_MODAL_TYPE_MAP[category as keyof typeof CATEGORY_MODAL_TYPE_MAP]
  const destination = modalType
    ? `/${username}/notes/${category}?m=${modalType.toString()}&mps=noteId=${id}`
    : `/${username}/notes/${category}`

  const [profile, note] = await Promise.all([
    queryClient
      .fetchQuery(profileByUsernameQueryOptions(fetchApi, username, 'lg'))
      .catch(() => null),
    queryClient
      .fetchQuery({
        queryKey: ['content-notes', 'public', category, id, 'md'],
        queryFn: () =>
          fetchApi<DetailedContentNote>(
            `/v1/content-notes/${category as ContentCategory}/${id}`,
            new URLSearchParams([['coverSize', 'md']]),
          ),
      })
      .catch(() => null),
  ])

  const jsonLd =
    profile && note?.content
      ? {
          '@context': 'https://schema.org',
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: profile.displayName,
          },
          itemReviewed: {
            '@type': categoryToSchemaType(note.content.category),
            name: note.content.title,
          },
          reviewBody: note.comment,
          datePublished: note.createdAt,
          reviewRating:
            typeof note.rate === 'number'
              ? {
                  '@type': 'Rating',
                  ratingValue: note.rate,
                  bestRating: 10,
                }
              : undefined,
        }
      : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RedirectToNoteModal href={destination} />
    </>
  )
}
