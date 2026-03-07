'use client'

import { ContentCategory } from '@/lib/model/content'
import { DetailedContentNote } from '@/lib/model/content-note'
import { cn } from '@/lib/utils'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { ModalType } from '@/stores/modal'
import {
  EllipsisIcon,
  PlusIcon,
  Settings2Icon,
  TextIcon,
  TrashIcon,
} from 'lucide-react'
import React from 'react'
import { Button } from '../button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { Separator } from '../separator'

type Props = React.ComponentProps<'div'> & {
  contentNote: DetailedContentNote
  category: ContentCategory
}

export default function ContentNoteCardControls({
  contentNote,
  category,
  className,
  ...props
}: Props) {
  const { profile } = useProfileStore((state) => state)
  const openModal = useModalStore((state) => state.openModal)

  const openGameNote = () => {
    switch (category) {
      case 'games':
        openModal(ModalType.GameNote, { noteId: contentNote.id })
        break
      case 'movies':
        openModal(ModalType.MovieNote, { noteId: contentNote.id })
        break
    }
  }

  const openGameNoteEditor = () => {
    switch (category) {
      case 'games':
        openModal(ModalType.GameNoteEditor, { noteId: contentNote.id })
        break
      case 'movies':
        openModal(ModalType.MovieNoteEditor, { noteId: contentNote.id })
        break
    }
  }

  const onDelete = () =>
    openModal(ModalType.DeleteContentAlert, {
      category: category,
      title: contentNote.content?.title ?? 'Unknown',
      id: contentNote.id,
    })

  const menuItems = [
    [
      {
        label: 'Open details',
        icon: TextIcon,
        color: 'text-primary',
        onClick: openGameNote,
        onlyMobile: true,
      },
    ],
    [
      {
        label: 'Edit details',
        icon: Settings2Icon,
        color: 'text-primary',
        onClick: openGameNoteEditor,
        onlyMobile: false,
      },
      {
        label: 'Add to collection',
        icon: PlusIcon,
        color: 'text-primary',
        onClick: () => {},
        disabled: true,
        onlyMobile: false,
      },
    ],
    [
      {
        label: 'Delete',
        icon: TrashIcon,
        color: 'text-destructive',
        onClick: onDelete,
        onlyMobile: false,
      },
    ],
  ]

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <Button
        variant="ghost"
        onClick={openGameNote}
        className="hidden lg:inline-flex"
      >
        <TextIcon className="size-4" />
        Details
      </Button>
      <Button
        variant="outline"
        className={cn(
          'inline-flex h-full flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-muted px-4 py-2 text-xs lg:hidden',
          profile?.context?.isAuthorized && 'hidden',
        )}
        onClick={openGameNote}
      >
        <EllipsisIcon className="size-6 text-muted-foreground" />
        more
      </Button>
      {profile?.context?.isAuthorized && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden lg:inline-flex">
                <EllipsisIcon />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="hidden lg:block">
              {menuItems.map((group, index) => (
                <div key={index} className="grid">
                  {group
                    .filter((item) => !item.onlyMobile)
                    .map((item) => (
                      <DropdownMenuItem
                        key={item.label}
                        className={cn(
                          'cursor-pointer',
                          item.disabled &&
                            'cursor-not-allowed text-muted-foreground',
                        )}
                        onClick={item.onClick}
                      >
                        <item.icon className={item.color} />
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  {index < menuItems.length - 1 &&
                    group.filter((item) => !item.onlyMobile).length > 0 && (
                      <DropdownMenuSeparator />
                    )}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'inline-flex h-full flex-col items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-muted px-4 py-2 text-xs lg:hidden',
                )}
              >
                <TextIcon className="size-6 text-muted-foreground" />
                more
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{contentNote.content?.title}</DrawerTitle>
                <DrawerDescription className="hidden">
                  {contentNote.content?.title} options
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-2 px-4 py-2">
                {menuItems.map((group, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    {group.map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        type="button"
                        onClick={item.onClick}
                        className="w-full"
                        disabled={item.disabled}
                      >
                        <item.icon className={item.color} />
                        {item.label}
                      </Button>
                    ))}
                    {index < menuItems.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  )
}
