'use client'

import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { toast } from '@/hooks/use-toast'
import ory from '@/lib/ory'
import { useModalStore } from '@/providers/modal'
import { SiTwitch } from '@icons-pack/react-simple-icons'
import {
  ErrorBrowserLocationChangeRequired,
  isResponseError,
  SettingsFlow,
  UiNodeInputAttributes,
} from '@ory/client-fetch'
import { KeyIcon, XIcon } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'
import TwitchIntegrationSettings from './twitch-integration-settings'

export default function TwitchIntegrationSettingsTab() {
  const { modalParams, setModalParams } = useModalStore((state) => state)

  const [isFlowPending, startFlowTransition] = React.useTransition()
  const [flow, setFlow] = React.useState<SettingsFlow>()

  const [isConnecting, startConnectingTransition] = React.useTransition()

  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isTwitchLinked =
    (
      flow?.ui?.nodes?.find(
        (node) =>
          node.group === 'oidc' &&
          (node.attributes as UiNodeInputAttributes).value?.toLowerCase() ===
            'twitch-extended',
      )?.attributes as UiNodeInputAttributes
    )?.name === 'unlink'

  React.useEffect(() => {
    if (flow?.id || isFlowPending) {
      return
    }

    startFlowTransition(async () => {
      let flow: SettingsFlow | undefined

      if (modalParams?.flow && modalParams.flow.length > 0) {
        try {
          flow = await ory.getSettingsFlow({
            id: modalParams.flow as string,
          })
        } catch (error) {
          if (isResponseError(error)) {
            error.response
              .json()
              .then((res) =>
                console.error(
                  'Failed to load existing settings flow',
                  JSON.stringify(res.error.message),
                ),
              )
          }
          flow = undefined
        }
      }

      if (!flow) {
        try {
          flow = await ory.createBrowserSettingsFlow({
            returnTo: `${pathname}?${searchParams.toString()}`,
          })
          setModalParams({
            tab: modalParams?.tab as string,
            flow: flow.id ?? undefined,
          })
        } catch (error) {
          if (isResponseError(error)) {
            if (error.response.status === 400) {
              const res = (await error.response.json()) as SettingsFlow
              toast({
                title: 'Failed to create settings flow',
                description:
                  res?.ui?.messages?.[0]?.text ?? 'An unknown error occurred',
              })
            }
          }
        }
      }

      setFlow(flow)
    })
  }, [])

  const handleTwitchConnect = () =>
    startConnectingTransition(async () => {
      if (!flow) return

      const attrs = flow.ui?.nodes?.find(
        (node) =>
          node.group === 'oidc' &&
          (node.attributes as UiNodeInputAttributes).value?.toLowerCase() ===
            'twitch-extended',
      )?.attributes as UiNodeInputAttributes
      try {
        const settingsFlow = await ory.updateSettingsFlow({
          flow: flow.id,
          updateSettingsFlowBody: {
            method: 'oidc',
            link: attrs.name === 'link' ? attrs.value : undefined,
            unlink: attrs.name === 'unlink' ? attrs.value : undefined,
          },
        })
        setFlow(settingsFlow)
      } catch (e) {
        if (isResponseError(e)) {
          if (e.response.status === 400) {
            const res = (await e.response.json()) as SettingsFlow
            toast({
              title: 'Failed to update settings flow',
              description:
                res?.ui?.messages?.[0]?.text ?? 'An unknown error occurred',
            })
            setFlow(res)
          } else if (e.response.status === 422) {
            const res =
              (await e.response.json()) as ErrorBrowserLocationChangeRequired
            if (res.redirect_browser_to) {
              window.location.href = res.redirect_browser_to
            }
          } else if (e.response.status === 403) {
            const res = await e.response.json()
            if (res.error.id === 'security_csrf_violation') {
              toast({
                title: 'Failed to connect Twitch',
                description: 'CSRF Violation. Please try again.',
                variant: 'destructive',
              })
            } else if (res.error.id === 'session_refresh_required') {
              window.location.href = `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser?refresh=true&return_to=${pathname}?${searchParams.toString()}`
            } else {
              toast({
                title: 'Error',
                description: res?.error?.message || 'Error linking provider',
                variant: 'destructive',
              })
            }
          }
        } else {
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
    <div className="flex h-full w-full flex-col justify-between space-y-6">
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <SiTwitch className={`h-4 w-4 text-sm text-[#6441A5]`} />
          <h1 className="text-lg font-bold">
            Twitch Channel Points Integration
          </h1>
        </div>
        <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
          <div className="flex flex-1 flex-col space-y-2 text-sm">
            You can provide access to channel points redemptions from your
            Twitch channel to automatically populate your orders.
          </div>
          <Button
            variant="outline"
            onClick={handleTwitchConnect}
            disabled={isFlowPending || isConnecting}
          >
            {isConnecting || isFlowPending ? (
              <LoadingSpinner />
            ) : isTwitchLinked ? (
              <XIcon className="h-4 w-4 text-destructive" />
            ) : (
              <KeyIcon className="h-4 w-4" />
            )}
            {isFlowPending
              ? 'Waiting...'
              : isTwitchLinked
                ? 'Disconnect'
                : 'Connect'}
          </Button>
        </div>
      </div>

      {isTwitchLinked && <TwitchIntegrationSettings />}

      {/* <IntegrationElement
                    icon={DonationAlertsIcon}
                    title="DonationAlerts"
                    description="You can provide access to donations from your DonationAlerts account to automatically populate your orders."
                    tbd
                />

                <IntegrationElement
                    icon={DonatePayIcon}
                    title="DonatePay"
                    description="You can provide access to donations from your DonatePay account to automatically populate your orders."
                    tbd
                />

                <IntegrationElement
                    icon={SiStreamlabs}
                    title="Streamlabs"
                    description="You can provide access to donations from your Streamlabs account to automatically populate your orders."
                    tbd
                />

                <IntegrationElement
                    icon={StreamElementsIcon}
                    title="StreamElements"
                    description="You can provide access to donations from your StreamElements account to automatically populate your orders."
                    tbd
                /> */}
    </div>
  )
}
