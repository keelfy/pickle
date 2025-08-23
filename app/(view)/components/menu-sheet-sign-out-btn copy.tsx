'use client'

import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { toast } from '@/hooks/use-toast'
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
      } catch (e) {
        toast({
          title: 'Failed to sign out',
          description: 'Please try again later.',
          variant: 'destructive',
        })
      }
    })

  return (
    <Button variant="secondary" onClick={onSignOut}>
      {isPending ? <LoadingSpinner /> : <LogOutIcon />}
      Sign Out
    </Button>
  )
}
