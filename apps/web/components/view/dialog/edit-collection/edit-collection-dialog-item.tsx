'use client'

import { Button } from '@/components/ui/button'
import ContentCategoryIcon from '@/components/ui/content-category-icon'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDeleteCollectionItemMutation } from '@/hooks/mutations/use-collection-mutations'
import { toastError } from '@/lib/toasts'
import { localizeContentCategory } from '@/lib/localize-types'
import { CollectionItem } from '@/lib/model/collection'
import { TrashIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { useCollectionContext } from '../../../ui/content-collections/collections-context'

type Props = {
  item: CollectionItem
}

export default function EditCollectionDialogItem({ item }: Props) {
  const [isDeleting, startTransition] = React.useTransition()
  const deleteCollectionItemMutation = useDeleteCollectionItemMutation()
  const { states, deleteItemFromCollection, addItemToCollection } =
    useCollectionContext()

  const onDeleteItem = () => {
    if (!states) return
    startTransition(async () => {
      const deletedItem = states
        .find((state) => state.collection.id === item.collectionId)
        ?.content.find((i) => i.id === item.id)
      if (!deletedItem) return
      deleteItemFromCollection(item.collectionId, deletedItem.id)

      try {
        await deleteCollectionItemMutation.mutateAsync({
          collectionId: item.collectionId,
          itemId: item.id,
        })
      } catch (error) {
        addItemToCollection(item.collectionId, deletedItem)
        toastError('Error while deleting item', error)
      }
    })
  }

  return (
    <TooltipProvider>
      <div className="flex">
        <Tooltip>
          <TooltipTrigger
            className="flex w-full flex-1 items-center rounded-md rounded-r-none border px-3"
            asChild
          >
            <div className="flex items-center gap-2">
              <ContentCategoryIcon
                category={item.content.category}
                className="h-4 w-4"
              />
              <p className="text-sm">{item.content.title}</p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            <p>{localizeContentCategory(item.content.category, false)}</p>
          </TooltipContent>
        </Tooltip>
        <Button
          variant="destructive"
          size="icon"
          className="rounded-l-none"
          onClick={onDeleteItem}
          disabled={isDeleting}
          type="button"
        >
          {isDeleting ? <LoadingSpinner /> : <TrashIcon />}
          <span className="sr-only">Delete item</span>
        </Button>
      </div>
    </TooltipProvider>
  )
}
