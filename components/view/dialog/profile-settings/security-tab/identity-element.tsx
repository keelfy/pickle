'use client'

import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import ory from '@/lib/ory'
import { cn } from '@/utils/cn'
import {
  isResponseError,
  SettingsFlow,
  UiNode,
  UiNodeInputAttributes,
} from '@ory/client-fetch'
import { Link2, Link2OffIcon } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

type Props = {
  className?: string
  providerType: string
  providerName: string
  providerIcon: React.ComponentType<{ className?: string }> | null
  providerColor: string
  flow: SettingsFlow | undefined
  isFlowLoading: boolean
  updateFlow: (flow: SettingsFlow) => void
}

export default function ProviderIdentityElement({
  className,
  providerType,
  providerName,
  providerIcon: ProviderIcon,
  providerColor,
  flow,
  isFlowLoading,
  updateFlow,
}: Props) {
  const [isPending, startTransition] = React.useTransition()

  const isLinked =
    (
      flow?.ui?.nodes?.find(
        (node) =>
          node.group === 'oidc' &&
          (node.attributes as UiNodeInputAttributes).value?.toLowerCase() ===
            providerType,
      )?.attributes as UiNodeInputAttributes
    )?.name === 'unlink'

  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onClick = () =>
    startTransition(async () => {
      if (!flow) return

      const attrs = flow.ui?.nodes?.find(
        (node) =>
          node.group === 'oidc' &&
          (node.attributes as UiNodeInputAttributes).value?.toLowerCase() ===
            providerType,
      )?.attributes as UiNodeInputAttributes
      try {
        const settingsFlow = await ory.updateSettingsFlow({
          flow: flow.id,
          updateSettingsFlowBody: {
            method: 'oidc',
            link: !isLinked ? attrs.value : undefined,
            unlink: isLinked ? attrs.value : undefined,
          },
        })
        updateFlow(settingsFlow)
      } catch (e) {
        // Handle 422 Unprocessable Entity - OAuth redirect required
        if (isResponseError(e) && e.response.status === 422) {
          try {
            const errorBody = await e.response.json()

            // Check if there's a redirect URL in the error response
            const redirectUrl = errorBody?.redirect_browser_to
            if (redirectUrl) {
              // Store current location to return to after OAuth flow
              const currentLocation = `${pathname}?${searchParams.toString()}`
              sessionStorage.setItem('oauth_return_url', currentLocation)

              // Redirect to OAuth provider (e.g., accounts.google.com)
              window.location.href = redirectUrl
              return
            }

            // Fallback to any messages in the UI nodes
            const errorMessage =
              errorBody?.ui?.messages?.[0]?.text ||
              errorBody?.ui?.nodes?.find(
                (node: UiNode) => node.messages?.length > 0,
              )?.messages[0]?.text ||
              'OAuth authentication required'

            toast({
              title: 'Authentication Required',
              description: errorMessage,
              variant: 'destructive',
            })
          } catch (parseError) {
            toast({
              title: 'Authentication Required',
              description: 'Please complete OAuth authentication',
              variant: 'destructive',
            })
          }
        } else {
          // Handle other errors
          toast({
            title: 'Error',
            description:
              e instanceof Error ? e.message : 'Error linking provider',
            variant: 'destructive',
          })
        }
      }
    })

  return (
    <div className="-space-y-1">
      <div
        className={cn('flex items-center justify-between space-x-4', className)}
      >
        <div className="flex flex-1 flex-col space-y-2">
          <div className="flex flex-1 items-center space-x-2 text-sm">
            {ProviderIcon && (
              <ProviderIcon
                className={`h-3 w-3 text-sm text-[#${providerColor}]`}
              />
            )}
            <p className="font-mono">{providerName}</p>
          </div>
        </div>
        <Separator className="flex-0" />
        <Button
          variant={isLinked ? 'destructive' : 'default'}
          onClick={onClick}
          disabled={isPending || isFlowLoading}
        >
          {isPending || isFlowLoading ? (
            <LoadingSpinner />
          ) : isLinked ? (
            <Link2OffIcon />
          ) : (
            <Link2 />
          )}
          {isLinked ? 'Unlink' : 'Link'}
        </Button>
      </div>
      {searchParams.has('providerError') &&
        searchParams.get('providerError') === providerType && (
          <p className="w-80 text-xs text-destructive">
            {searchParams.get('linkingError') ??
              'Error occurred during linking process. Try again later.'}
          </p>
        )}
    </div>
  )
}
