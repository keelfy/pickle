import {
  fetchContentNote,
  fetchProfileByUsername,
} from '@/hooks/api-endpoints-server'
import { ContentCategory } from '@/lib/model/content'
import { DetailedContentNote } from '@/lib/model/content-note'
import { ModalType } from '@/stores/modal'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

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

  const profile = await fetchProfileByUsername(username).catch(() => null)

  if (!profile) {
    return {
      title: '404 Profile not found - pickle',
      description: '404 Profile not found - pickle',
    }
  }

  const note = await fetchContentNote<DetailedContentNote>(
    category as ContentCategory,
    id,
  ).catch(() => null)

  if (!note?.content) {
    return {
      title: '404 Content note not found - pickle',
      description: '404 Content note not found - pickle',
    }
  }

  const title = `${note.content?.title ?? ''} - ${profile.displayName}`
  const description = `Thoughts of ${profile.displayName} on ${note.content?.title ?? ''}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: note.content.coverUrl ? [note.content.coverUrl] : undefined,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_DOMAIN}/${username}/notes/${category}/${id}`,
      authors: [profile.displayName],
      publishedTime: note.createdAt,
    },
  }
}

const CATEGORY_MODAL_TYPE_MAP = {
  movie: ModalType.MovieNote,
  game: ModalType.GameNote,
} as const

export default async function ContentNotePage({ params }: Props) {
  const { category, id } = await params

  const modalType =
    CATEGORY_MODAL_TYPE_MAP[category as keyof typeof CATEGORY_MODAL_TYPE_MAP]

  return redirect(`/notes/${category}?m=${modalType}&mps=noteId=${id}`)
}
