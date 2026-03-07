'use client'

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useDeleteContentNoteMutation } from '@/hooks/mutations/use-content-note-mutations'
import { toastError } from '@/lib/toasts'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { Check, X } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { DeleteContentAlertModalParams } from './delete-content-alert-dialog'

export default function DeleteContentAlertDialogContent() {
  const { closeModal } = useModalStore((state) => state)
  const profile = useProfileStore((state) => state.profile)
  const modalParams = useModalStore<DeleteContentAlertModalParams | undefined>(
    (state) => state.modalParams as DeleteContentAlertModalParams | undefined,
  )
  const [isLoading, startTransition] = React.useTransition()
  const deleteContentNoteMutation = useDeleteContentNoteMutation()
  const [resetApprovedOrders, setResetApprovedOrders] = React.useState(true)

  const onConfirm = () => {
    if (!modalParams?.category || !modalParams?.id || !profile) {
      return
    }

    startTransition(async () => {
      try {
        await deleteContentNoteMutation.mutateAsync({
          user: profile,
          category: modalParams.category,
          noteId: modalParams.id,
          resetApprovedOrders,
        })
        closeModal()
        toast.success('Content deleted successfully', {
          description: `The content ${modalParams?.title} has been deleted.`,
        })
      } catch (error) {
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
          You&apos;re about to delete&nbsp;
          <span className="font-semibold">{modalParams?.title}</span>.
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={resetApprovedOrders}
              onCheckedChange={() =>
                setResetApprovedOrders(!resetApprovedOrders)
              }
            />
            <span>Set all related orders back to pending status</span>
          </div>
          <div className="text-destructive">This action cannot be undone.</div>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={closeModal} disabled={isLoading}>
          <X />
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
          <Check />
          Confirm
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
