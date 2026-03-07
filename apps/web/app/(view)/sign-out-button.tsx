'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import LoadingSpinner from '@/components/ui/loading-spinner'
import ory from '@/lib/ory'
import { toastError } from '@/lib/toasts'
import { LogOut } from 'lucide-react'
import React from 'react'

const DropdownMenuSignOutItem = () => {
  const [isPending, startTransition] = React.useTransition()

  const onSignOut = () =>
    startTransition(async () => {
      try {
        const flow = await ory.createBrowserLogoutFlow()
        await ory.updateLogoutFlow({
          token: flow.logout_token,
          returnTo: window.location.href,
        })
        window.location.reload()
      } catch (error) {
        toastError('Failed to sign out', error)
      }
    })

  return (
    <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
      {isPending ? <LoadingSpinner /> : <LogOut />}
      Log Out
    </DropdownMenuItem>
  )
}

export default DropdownMenuSignOutItem
