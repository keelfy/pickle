'use client'

import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { toastError } from '@/lib/toasts'
import ory from '@/lib/ory'
import { LogOutIcon } from 'lucide-react'
import React from 'react'

export default function MenuSheetSignOutButton() {
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
    <Button variant="secondary" onClick={onSignOut}>
      {isPending ? <LoadingSpinner /> : <LogOutIcon />}
      Sign Out
    </Button>
  )
}
