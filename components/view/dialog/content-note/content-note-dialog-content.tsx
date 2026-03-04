'use client'

import ContentNotePoster from '@/components/ui/content-note/content-note-poster'
import ContentNoteRequesterAvatar from '@/components/ui/content-note/content-note-requester-avatar'
import { ContentNoteStatusIcon } from '@/components/ui/content-note/content-note-status-icon'
import OrdererPopover from '@/components/ui/content-note/orderer-popover'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import IGDBIcon from '@/components/ui/icons/igdb-icon'
import { PopoverTrigger } from '@/components/ui/popover'
import { ContentNoteDialogOrdersSection } from '@/components/view/dialog/content-note/content-note-dialog-orders-section'
import { useContentNote } from '@/hooks/queries/use-content-note'
import {
  localizeContentCategory,
  localizeContentNoteStatus,
} from '@/lib/localize-types'
import { ContentCategory } from '@/lib/model/content'
import { DetailedContentNote } from '@/lib/model/content-note'
import { Profile } from '@/lib/model/user'
import { toastError } from '@/lib/toasts'
import { useProfileStore } from '@/providers/profile-store'
import {
  SiThemoviedatabase,
  SiThemoviedatabaseHex,
} from '@icons-pack/react-simple-icons'
import { CheckIcon, HistoryIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import getContentSourceLinks from '../content-note-editor/get-content-source-links'
import ContentNoteDialogRated from './content-note-dialog-rated'
import ContentNoteDialogReview from './content-note-dialog-review'

export type ContentNoteDialogDataRow<T extends DetailedContentNote> = {
  icon: React.ElementType
  key: string
  getLabel: (contentNote: T, profile: Profile) => React.ReactNode
  getValue: (contentNote: T, profile: Profile) => React.ReactNode
}

const defaultDataRows: ContentNoteDialogDataRow<DetailedContentNote>[] = [
  {
    icon: CheckIcon,
    key: 'status',
    getLabel: () => 'Status',
    getValue: (contentNote) => (
      <div className="flex items-center gap-2">
        <ContentNoteStatusIcon status={contentNote.status} className="size-4" />
        <label>{localizeContentNoteStatus(contentNote.status)}</label>
      </div>
    ),
  },
  {
    icon: HistoryIcon,
    key: 'createdAt',
    getLabel: () => 'Added on',
    getValue: (contentNote) => {
      return new Date(contentNote.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
  {
    icon: UserIcon,
    key: 'orderer',
    getLabel: (contentNote, profile) => {
      return contentNote.initialOrderer?.userId === profile.id
        ? 'Added by'
        : 'Requested by'
    },
    getValue: (contentNote) => {
      const orderer = contentNote.initialOrderer
      return (
        <OrdererPopover orderer={orderer}>
          <PopoverTrigger>
            <div className="flex cursor-pointer items-center gap-2 rounded-md underline-offset-2 transition-colors hover:text-foreground hover:underline">
              <ContentNoteRequesterAvatar orderer={orderer} />
              <p>{orderer?.displayName ?? 'Unknown'}</p>
            </div>
          </PopoverTrigger>
        </OrdererPopover>
      )
    },
  },
]

type Props<T extends DetailedContentNote> = {
  noteId: string
  category: ContentCategory
  additionalDataRows?: ContentNoteDialogDataRow<T>[]
  isDesktop: boolean | undefined
}

export default function ContentNoteDialogContent<
  T extends DetailedContentNote,
>({ noteId, category, additionalDataRows = [], isDesktop }: Props<T>) {
  const { profile } = useProfileStore((state) => state)
  const { data: contentNote, isPending: isLoading, error } = useContentNote<T>({
    user: profile ?? undefined,
    category,
    noteId,
  })

  React.useEffect(() => {
    if (error) {
      toastError(`Failed to load ${localizeContentCategory(category)} note`, error)
    }
  }, [category, error])
  // const [reactions, setReactions] = React.useState<ContentNoteReaction[]>()

  // React.useEffect(() => {
  //   if (!profile?.id) return
  //   ;(async () => {
  //     try {
  //       const res = await fetchBatchContentNoteReactions(profile, category, [
  //         noteId,
  //       ])
  //       setReactions(res[0]?.reactions ?? [])
  //     } catch (error) {
  //       setReactions([])
  //     }
  //   })()
  // }, [noteId])

  const Header = isDesktop ? DialogHeader : DrawerHeader
  const HeaderTitle = isDesktop ? DialogTitle : DrawerTitle
  const HeaderDescription = isDesktop ? DialogDescription : DrawerDescription
  const Footer = isDesktop ? DialogFooter : DrawerFooter

  const SourceIcon =
    contentNote?.content?.sourceType?.toLowerCase() === 'igdb' ? (
      <IGDBIcon className="w-12" />
    ) : (
      <SiThemoviedatabase className="size-7" color={SiThemoviedatabaseHex} />
    )

  const dataRows =
    contentNote &&
    profile &&
    [...defaultDataRows, ...additionalDataRows].flatMap((row) => {
      const label = row.getLabel(contentNote, profile)
      const value = row.getValue(contentNote, profile)

      return [
        <div
          className="flex flex-nowrap items-center gap-2 text-sm font-semibold"
          key={row.key + 'label'}
        >
          <row.icon className="size-3" />
          {label}
        </div>,
        <div key={row.key + 'value'} className="text-sm">
          {value}
        </div>,
      ]
    })

  return (
    <>
      <Header>
        <HeaderTitle>
          {contentNote?.content?.title}
          {contentNote?.content && 'releaseDate' in contentNote.content && (
            <span className="text-sm text-muted-foreground">
              &nbsp; (
              {new Date(
                contentNote.content.releaseDate as string,
              ).toLocaleDateString(undefined, {
                year: 'numeric',
              })}
              )
            </span>
          )}
        </HeaderTitle>
        <HeaderDescription>
          Thoughts of {profile?.displayName} about this&nbsp;
          {localizeContentCategory(category).toLocaleLowerCase()}.
        </HeaderDescription>
      </Header>

      <div className="flex flex-col gap-6 px-4 lg:px-0">
        <div className="flex items-start space-x-4">
          <ContentNotePoster
            posterUrl={contentNote?.content?.coverUrl}
            size={isDesktop ? 'md' : 'sm'}
            loading={isLoading}
          />
          <div className="flex min-h-[144px] w-full flex-col lg:min-h-[225px]">
            <div className="flex-0 grid grid-cols-2 gap-2">{dataRows}</div>
            <div className="mb-1 mt-auto flex items-start gap-3">
              {contentNote?.content?.sourceUrl && (
                <Link href={contentNote?.content?.sourceUrl} target="_blank">
                  {SourceIcon}
                </Link>
              )}
              {contentNote?.content?.websites &&
                getContentSourceLinks(contentNote.content?.websites)}
            </div>
          </div>
        </div>

        <ContentNoteDialogRated rating={contentNote?.rate} />

        <ContentNoteDialogReview
          contentNote={contentNote}
          category={category}
          defaultReactions={[]}
          // defaultReactions={reactions}
        />

        <ContentNoteDialogOrdersSection
          contentNote={contentNote}
          category={category}
        />
      </div>

      <Footer />
    </>
  )
}
