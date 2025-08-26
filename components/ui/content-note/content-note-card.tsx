import ContentNoteClickablePoster from '@/components/ui/content-note/content-note-clickable-poster'
import { GameNoteDialogParams } from '@/components/view/dialog/game-note/game-note-dialog'
import { MovieNoteDialogParams } from '@/components/view/dialog/movie-note/movie-note-dialog'
import { ContentCategory } from '@/lib/model/content'
import { ContentNote, DetailedContentNote } from '@/lib/model/content-note'
import { ContentNoteReaction } from '@/lib/model/note-reaction'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { useModalStore } from '@/providers/modal'
import { ModalParamValue, ModalType } from '@/stores/modal'
import React from 'react'
import ContentNoteCardComment from './content-note-card-comment'
import ContentNoteCardControls from './content-note-card-controls'
import ContentNoteCardRating from './content-note-card-rating'
import ContentNoteStatusBadge from './content-note-status-badge'

const openContentNoteModal = (
  openModal: (
    modalType: ModalType,
    params?: Record<string, ModalParamValue>,
  ) => void,
  category: ContentCategory,
  contentId: string,
) => {
  switch (category) {
    case 'games':
      const gameParams: GameNoteDialogParams = {
        noteId: contentId,
      }
      openModal(ModalType.GameNote, gameParams)
      break
    case 'movies':
      const movieParams: MovieNoteDialogParams = {
        noteId: contentId,
      }
      openModal(ModalType.MovieNote, movieParams)
      break
  }
}

type ContentNoteCardShellProps = React.ComponentProps<'div'>

function ContentNoteCardShell({
  children,
  className,
  ...props
}: React.PropsWithChildren<ContentNoteCardShellProps>) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-3 text-start', className)}
      {...props}
    >
      {children}
    </div>
  )
}
ContentNoteCardShell.displayName = 'ContentNoteCardShell'

export { ContentNoteCardShell, type ContentNoteCardShellProps }

type ContentNoteCardHeaderProps = React.ComponentProps<'div'>

function ContentNoteCardHeader({
  children,
  className,
  ...props
}: React.PropsWithChildren<ContentNoteCardHeaderProps>) {
  return (
    <div className={cn('flex justify-between gap-4', className)} {...props}>
      {children}
    </div>
  )
}
ContentNoteCardHeader.displayName = 'ContentNoteCardHeader'

export { ContentNoteCardHeader, type ContentNoteCardHeaderProps }

type ContentNoteCardHeaderInfoProps = React.ComponentProps<'div'> & {
  note: DetailedContentNote
  category: ContentCategory
}

function ContentNoteCardHeaderInfo({
  note,
  category,
  children,
  className,
  ...props
}: React.PropsWithChildren<ContentNoteCardHeaderInfoProps>) {
  return (
    <div className={cn('flex h-full items-start gap-4', className)} {...props}>
      <ContentNoteClickablePoster
        contentId={note.id}
        coverUrl={note.content?.coverUrl ?? ''}
        category={category}
        className="flex-shrink-0"
      />
      {children}
    </div>
  )
}
ContentNoteCardHeaderInfo.displayName = 'ContentNoteCardHeaderInfo'

export { ContentNoteCardHeaderInfo, type ContentNoteCardHeaderInfoProps }

type ContentNoteCardHeaderSummaryProps = React.ComponentProps<'div'>

function ContentNoteCardHeaderSummary({
  children,
  className,
  ...props
}: React.PropsWithChildren<ContentNoteCardHeaderSummaryProps>) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-1 flex-col justify-between gap-2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
ContentNoteCardHeaderSummary.displayName = 'ContentNoteCardHeaderSummary'

export { ContentNoteCardHeaderSummary, type ContentNoteCardHeaderSummaryProps }

type ContentNoteCardHeaderNameProps = React.ComponentProps<'div'> & {
  title: string
  startYear?: number
  endYear?: number
}

function ContentNoteCardHeaderName({
  title,
  startYear,
  endYear,
  className,
  ...props
}: React.PropsWithChildren<ContentNoteCardHeaderNameProps>) {
  return (
    <p className={cn('', className)} {...props}>
      <span className="text-md font-bold">{title}</span>
      {startYear && (
        <span className="text-sm text-muted-foreground">
          &nbsp;&nbsp;{startYear}
        </span>
      )}
      {startYear && endYear && (
        <span className="text-sm text-muted-foreground">&nbsp;-&nbsp;</span>
      )}
      {endYear && (
        <span className="text-sm text-muted-foreground">{endYear}</span>
      )}
    </p>
  )
}
ContentNoteCardHeaderName.displayName = 'ContentNoteCardHeaderName'

export { ContentNoteCardHeaderName, type ContentNoteCardHeaderNameProps }

type ContentNoteCardHeaderDataTableColumn<T extends ContentNote> = {
  icon: React.ReactNode
  label: string | React.ReactNode | ((note: T) => React.ReactNode)
  value: (note: T) => React.ReactNode
  showOnMobile?: boolean
}

type ContentNoteCardHeaderDataTableColumnGroup<T extends ContentNote> = {
  columns: ContentNoteCardHeaderDataTableColumn<T>[]
}

type ContentNoteCardHeaderDataTableProps<T extends ContentNote> =
  React.ComponentProps<'div'> & {
    columnGroups: ContentNoteCardHeaderDataTableColumnGroup<T>[]
    note: T
    className?: string
  }

function ContentNoteCardHeaderDataTable<T extends ContentNote>({
  columnGroups,
  note,
  className,
  ...props
}: ContentNoteCardHeaderDataTableProps<T>) {
  const cells: React.ReactNode[] = []

  const isMobile = useMediaQuery('(max-width: 1024px)')

  columnGroups.forEach((group) =>
    group.columns.forEach((col, colIndex) => {
      if (isMobile && !col.showOnMobile) return
      else if (!isMobile && col.showOnMobile) return

      const label =
        typeof col.label === 'function' ? col.label(note) : col.label
      const value =
        typeof col.value === 'function' ? col.value(note) : col.value
      const key = typeof label === 'string' ? label : colIndex
      cells.push(
        <div
          className={cn('flex flex-nowrap items-center gap-1 text-sm')}
          key={key + 'label'}
        >
          {col.icon}
          <p className="text-nowrap">{label}</p>
        </div>,
      )
      cells.push(
        <div key={key + 'value'} className="text-sm">
          {value}
        </div>,
      )
    }),
  )
  return (
    <div
      className={cn(
        'grid grid-cols-2 items-center gap-1 gap-x-3 text-nowrap text-sm',
        className,
      )}
      {...props}
    >
      {cells}
    </div>
  )
}
ContentNoteCardHeaderDataTable.displayName = 'ContentNoteCardHeaderDataTable'

export {
  ContentNoteCardHeaderDataTable,
  type ContentNoteCardHeaderDataTableColumn,
  type ContentNoteCardHeaderDataTableColumnGroup,
  type ContentNoteCardHeaderDataTableProps,
}

type ContentNoteCardProps<T extends DetailedContentNote> = {
  note: T
  category: ContentCategory
  defaultReactions?: ContentNoteReaction[]
  releaseYear?: number
  finishedYear?: number
  columnGroups: ContentNoteCardHeaderDataTableColumnGroup<T>[]
}

export default function ContentNoteCard<T extends DetailedContentNote>({
  note,
  category,
  defaultReactions,
  releaseYear,
  finishedYear,
  columnGroups,
}: ContentNoteCardProps<T>) {
  const openModal = useModalStore((state) => state.openModal)
  return (
    <ContentNoteCardShell>
      <ContentNoteCardHeader>
        <ContentNoteCardHeaderInfo note={note} category={category}>
          <ContentNoteCardHeaderSummary>
            <div className="flex flex-col items-start gap-1 lg:gap-3">
              <ContentNoteCardHeaderName
                title={note.content?.title ?? ''}
                startYear={releaseYear}
                endYear={finishedYear}
              />
              <ContentNoteCardHeaderDataTable
                note={note}
                columnGroups={columnGroups}
              />
            </div>
            <div className="flex gap-2 lg:hidden">
              <ContentNoteCardRating rate={note.rate} className="inline-flex" />
              {/* <ContentNoteCardControls contentNote={note} category={category} /> */}
              {/* <div className="inline-flex flex-col items-center justify-center rounded-lg bg-secondary px-4 py-2">
                <div className="text-muted-foreground">
                  <ContentNoteStatusIcon
                    status={note.status}
                    classname="size-6"
                  />
                </div>
                <div className="whitespace-nowrap text-xs font-semibold">
                  status
                </div>
              </div> */}
              <ContentNoteCardControls contentNote={note} category={category} />
            </div>
            <ContentNoteCardControls
              contentNote={note}
              category={category}
              className="hidden lg:flex"
            />
          </ContentNoteCardHeaderSummary>
        </ContentNoteCardHeaderInfo>
        <div className="flex h-min gap-4">
          <div className="px-2 py-4">
            <ContentNoteStatusBadge
              status={note.status}
              className="hidden lg:flex"
            />
          </div>
          <ContentNoteCardRating
            rate={note.rate}
            className="hidden lg:inline-flex"
          />
        </div>
      </ContentNoteCardHeader>
      <ContentNoteCardComment
        comment={note.comment}
        onShowMore={() => openContentNoteModal(openModal, category, note.id)}
      />
      {/* {defaultReactions && (
        <ContentNoteReactions
          contentNote={note}
          category={category}
          defaultReactions={defaultReactions}
        />
      )} */}
    </ContentNoteCardShell>
  )
}
