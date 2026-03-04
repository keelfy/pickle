'use client'

import { Button } from '@/components/ui/button'
import ContentCategoryIcon from '@/components/ui/content-category-icon'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { localizeContentCategory } from '@/lib/localize-types'
import {
  ContentCategory,
  ContentCategoryEnum,
  VISIBLE_CONTENT_CATEGORIES,
} from '@/lib/model/content'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import React from 'react'

const ENABLED_CATEGORIES = [
  ContentCategoryEnum.Games,
  ContentCategoryEnum.Movies,
]

type Props = {
  isDesktop: boolean
}

export default function ManualNoteCreationDialogContent({ isDesktop }: Props) {
  const openModal = useModalStore((state) => state.openModal)

  const handleExternalSearchClick = (category: ContentCategory) =>
    openModal(ModalType.SelectContentItem, { category })

  const isDisabled = React.useCallback(
    (category: ContentCategory) =>
      !ENABLED_CATEGORIES.includes(category as ContentCategoryEnum),
    [],
  )

  return (
    <>
      {isDesktop ? (
        <div className="hidden">
          <DialogHeader>
            <DialogTitle>Manual content creation</DialogTitle>
          </DialogHeader>
        </div>
      ) : (
        <DrawerHeader>
          <DrawerTitle>What do you want to add to your profile?</DrawerTitle>
          <DrawerDescription>
            Select the category of content you want to add to your profile.
          </DrawerDescription>
        </DrawerHeader>
      )}

      <div className="grid gap-4 p-6 lg:p-0">
        <h2 className="hidden text-center text-lg font-bold lg:block">
          What do you want to add to your profile?
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {VISIBLE_CONTENT_CATEGORIES.map((category: ContentCategory) => (
            <Button
              key={category}
              size="lg"
              className="text-md w-full"
              disabled={isDisabled(category)}
              onClick={() => handleExternalSearchClick(category)}
            >
              <ContentCategoryIcon category={category} className="h-6 w-6" />
              {localizeContentCategory(category)}
            </Button>
          ))}
        </div>
      </div>
    </>
  )
}
