'use client'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import LoadingSpinner from '@/components/ui/loading-spinner'
import ory from '@/lib/ory'
import { toastError } from '@/lib/toasts'
import { useAuthStore } from '@/providers/auth-store'
import { useModalStore } from '@/providers/modal'
import {
  isResponseError,
  SettingsFlow,
  UiNodeInputAttributes,
} from '@ory/client-fetch'
import {
  AlertTriangleIcon,
  ChevronsUpDown,
  ComputerIcon,
  EyeIcon,
  EyeOffIcon,
  LogOutIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'
import EmailChangeForm from './email-change-form'
import PasswordChangeElement from './password-change-element'
import SecurityLinkedProviders from './security-linked-providers'
import { parseAsString, useQueryState } from 'nuqs'

export default function SecuritySettingsTab() {
  const [flowId, setFlowId] = useQueryState(
    'flow',
    parseAsString.withDefault(''),
  )

  const [isFlowPending, startFlowTransition] = React.useTransition()
  const [flow, setFlow] = React.useState<SettingsFlow>()

  const { session, updateSession } = useAuthStore((state) => state)
  const email = session?.identity?.traits?.email

  const [emailHidden, setEmailHidden] = React.useState(true)
  const [isLoggingOutAll, startLogOutAll] = React.useTransition()

  const pathname = usePathname()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    if (flow?.id || isFlowPending) {
      return
    }

    startFlowTransition(async () => {
      let flow: SettingsFlow | undefined

      if (flowId && flowId.length > 0) {
        try {
          flow = await ory.getSettingsFlow({
            id: flowId,
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
            returnTo: goto,
          })
          setFlowId(flow.id ?? '')
        } catch (error) {
          if (isResponseError(error)) {
            if (error.response.status === 400) {
              const res = (await error.response.json()) as SettingsFlow
              toastError('Failed to create settings flow', res)
            }
          }
        }
      }

      setFlow(flow)
    })
  }, [])

  const canModifyEmail = React.useMemo(
    () =>
      (
        flow?.ui?.nodes?.find(
          (node) =>
            node.group === 'profile' &&
            (node.attributes as UiNodeInputAttributes).name === 'traits.email',
        )?.attributes as UiNodeInputAttributes
      )?.disabled === false,
    [flow?.ui?.nodes],
  )

  const isEmailVerified = React.useMemo(
    () =>
      session?.identity?.verifiable_addresses?.some(
        (address) => address.verified,
      ),
    [session?.identity?.verifiable_addresses],
  )

  const goto = React.useMemo(() => {
    return `${pathname}?${searchParams.toString()}`
  }, [pathname, searchParams])

  const logOutAll = () =>
    startLogOutAll(async () => {
      if (session?.devices?.length === 1) return
      try {
        await ory.disableMyOtherSessions()
        const session = await ory.toSession()
        updateSession(session)
        toast.success('Disabled other sessions', {
          description: 'You have been logged out of other sessions.',
        })
      } catch (error) {
        toastError('Failed to log out all devices', error)
      }
    })

  return (
    <div className="flex h-full w-full flex-col justify-between space-y-6">
      <div className="flex flex-col space-y-6">
        {!isEmailVerified && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-yellow-500/20 bg-yellow-50 p-4 dark:bg-yellow-600/20">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
              <p className="text-sm">Your email address is not verified.</p>
            </div>
            <Link
              href={`${process.env.NEXT_PUBLIC_DOMAIN}/auth/verification?goto=${encodeURIComponent(goto)}&email=${encodeURIComponent(email ?? '')}`}
              className="flex items-center gap-1 text-blue-500 no-underline hover:underline"
            >
              Verify
            </Link>
          </div>
        )}

        <Collapsible>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-1 flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <p>
                  {emailHidden
                    ? `${email?.split('@')[0].slice(0, 1)}${(email?.split('@')[0].length ?? 0) > 2 && '...'}${email?.split('@')[0].slice(-1)}@${email?.split('@')[1]}`
                    : email}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setEmailHidden(!emailHidden)}
                >
                  {emailHidden ? (
                    <EyeIcon size={12} />
                  ) : (
                    <EyeOffIcon size={12} />
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Your email address is used to log in and send you notifications.
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-1"
                disabled={isFlowPending || !canModifyEmail}
              >
                Change {isFlowPending ? <LoadingSpinner /> : <ChevronsUpDown />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            {flow && (
              <EmailChangeForm
                className="mt-4"
                flow={flow}
                updateFlow={setFlow}
              />
            )}
          </CollapsibleContent>
        </Collapsible>

        <PasswordChangeElement
          flow={flow}
          isFlowPending={isFlowPending}
          updateFlow={setFlow}
        />

        {/* <MFAElement /> */}

        <SecurityLinkedProviders
          flow={flow}
          updateFlow={setFlow}
          isFlowLoading={isFlowPending}
        />

        <div className="flex flex-col space-y-2">
          <h2 className="text-lg font-semibold">Active Sessions</h2>
          <div className="grid gap-2">
            {session?.devices?.map((device) => (
              <div key={device.id} className="grid gap-1">
                <div className="flex animate-pulse items-center gap-2 text-sm">
                  <ComputerIcon className="h-4 w-4" />
                  <p>{device.location ?? 'Unknown location'}</p>&bull;
                  <p className="text-muted-foreground">{device.ip_address}</p>
                </div>
                {device.user_agent && (
                  <p className="text-xs text-muted-foreground">
                    &mdash;&nbsp;{device.user_agent}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between space-x-4 pt-2">
            <div className="flex flex-1 flex-col space-y-2">
              <div className="flex flex-1 items-center space-x-2">
                <LogOutIcon className="h-4 w-4" />
                <p>Log out of sessions</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Log out of all active sessions across all devices, excluding
                your current session.
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={logOutAll}
              disabled={isLoggingOutAll}
            >
              Log out all
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
