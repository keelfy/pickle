'use client'

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { fetchDeleteCollection } from '@/hooks/api-endpoints-client'
import { toastError } from '@/lib/toasts'
import { useModalStore } from '@/providers/modal'
import { Trash, X } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { useCollectionContext } from '../../../ui/content-collections/collections-context'
import { DeleteCollectionAlertModalParams } from './delete-collection-alert-dialog'

export default function DeleteContentAlertDialogContent() {
  const { closeModal } = useModalStore((state) => state)
  const modalParams = useModalStore<
    DeleteCollectionAlertModalParams | undefined
  >(
    (state) =>
      state.modalParams as DeleteCollectionAlertModalParams | undefined,
  )
  const [isLoading, startTransition] = React.useTransition()
  const {
    states: collections,
    deleteCollection,
    addCollection,
  } = useCollectionContext()

  const onConfirm = () => {
    if (!modalParams?.id) return
    startTransition(async () => {
      const deletedCollection = collections.find(
        (c) => c.collection.id === modalParams.id,
      )
      if (!deletedCollection) return

      deleteCollection(modalParams?.id)
      try {
        await fetchDeleteCollection(modalParams?.id)
        closeModal()
        toast.success('Collection deleted successfully', {
          description: `The collection ${modalParams?.name} has been deleted.`,
        })
      } catch (error: unknown) {
        addCollection(deletedCollection.collection)
        toastError('Failed to delete content', error)
      }
    })
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      </AlertDialogHeader>

      <div className="flex flex-col gap-2 text-sm">
        <div>
          You&apos;re about to delete collection&nbsp;
          <span className="font-semibold">{modalParams?.name}</span>.
        </div>

        <div className="text-destructive">This action cannot be undone.</div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={closeModal} disabled={isLoading}>
          <X />
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
          <Trash />
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
