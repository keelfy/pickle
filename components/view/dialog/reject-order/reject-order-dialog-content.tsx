'use client'

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { rejectOrderById } from '@/hooks/api-endpoints-client'
import { toastError } from '@/lib/toasts'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { Check, X } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { RejectOrderDialogParams } from './reject-order-dialog'

export default function RejectOrderDialogContent() {
  const { closeModal } = useModalStore((state) => state)
  const profile = useProfileStore((state) => state.profile)
  const { id, message, odn } = useModalStore(
    (state) => state.modalParams!,
  ) as RejectOrderDialogParams

  const [isLoading, startTransition] = React.useTransition()

  const onConfirm = () =>
    startTransition(async () => {
      if (!profile || !id) return

      try {
        await rejectOrderById(profile, id as string)
        closeModal()
        toast.success(`Order rejected successfully`, {
          description: `${odn ?? 'The user'} will not be notified!`,
        })
      } catch (error: unknown) {
        toastError('Failed to reject order', error)
      }
    })

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      </AlertDialogHeader>

      <div>
        You&apos;re about to cancel suggestion of
        <br />
        <span className="font-semibold">{message}</span>
        &nbsp;from&nbsp;
        <span className="font-semibold">{odn ?? 'The user'}</span>
        .
        <br />
        <br />
        By cancelling the suggestion, the user who ordered will not be notified
        and money will not be refunded.
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={closeModal} disabled={isLoading}>
          <X />
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
          {isLoading ? <LoadingSpinner /> : <Check />}
          Confirm
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
