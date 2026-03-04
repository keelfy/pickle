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
import { getModalParams, ModalType } from '@/stores/modal'
import { Check, X } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

export default function RejectOrderDialogContent() {
  const { closeModal } = useModalStore((state) => state)
  const profile = useProfileStore((state) => state.profile)
  const rawModalParams = useModalStore((state) => state.modalParams)
  const params = React.useMemo(
    () => getModalParams(ModalType.RejectOrder, rawModalParams),
    [rawModalParams],
  )

  const [isLoading, startTransition] = React.useTransition()

  const onConfirm = () =>
    startTransition(async () => {
      if (!profile || !params?.id) return

      try {
        await rejectOrderById(profile, params.id)
        closeModal()
        toast.success(`Order rejected successfully`, {
          description: `${params.odn ?? 'The user'} will not be notified!`,
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
        <span className="font-semibold">{params?.message}</span>
        &nbsp;from&nbsp;
        <span className="font-semibold">{params?.odn ?? 'The user'}</span>
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
