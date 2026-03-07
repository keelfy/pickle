'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import PickleLogo from '@/components/ui/icons/pickle-logo'
import YandexIcon from '@/components/ui/icons/yandex-icon'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import config from '@/ory.config'
import {
  SiDiscord,
  SiDiscordHex,
  SiGoogle,
  SiGoogleHex,
  SiTwitch,
  SiTwitchHex,
} from '@icons-pack/react-simple-icons'
import { RegistrationFlow } from '@ory/client-fetch'
import {
  OryCardContentProps,
  OryCardDividerProps,
  OryFormGroupProps,
  OryMessageContentProps,
  OryMessageRootProps,
  OryNodeButtonProps,
  OryNodeInputProps,
  OryNodeLabelProps,
  OryNodeSsoButtonProps,
} from '@ory/elements-react'
import { Registration } from '@ory/elements-react/theme'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

type Props = {
  flow: RegistrationFlow
}

const ProviderIcons = {
  google: SiGoogle,
  twitch: SiTwitch,
  discord: SiDiscord,
  yandex: YandexIcon,
}

const ProviderIconHex = {
  google: SiGoogleHex,
  twitch: SiTwitchHex,
  discord: SiDiscordHex,
  yandex: undefined,
}

type SsoLabel = {
  context: {
    provider: string
    provider_id: string
  }
}

export function RegistrationForm({ flow }: Props) {
  console.log(flow)
  return (
    <Registration
      flow={flow}
      config={config}
      components={{
        Card: {
          Root: (props: PropsWithChildren) => (
            <Card className="max-w-sm">{props.children}</Card>
          ),
          Header: () => (
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                Sign Up
                <PickleLogo className="h-5" />
              </CardTitle>
              <CardDescription>
                Sign up with your email and password or a social provider
              </CardDescription>
            </CardHeader>
          ),
          Divider: (props: OryCardDividerProps) => <div {...props} />,
          Content: (props: OryCardContentProps) => (
            <CardContent>{props.children}</CardContent>
          ),
          Footer: () => (
            <CardFooter>
              Already have an account?&nbsp;
              <Link
                href={{
                  pathname: `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser`,
                  query: {
                    return_to: flow?.return_to ?? '/',
                  },
                }}
                className="underline"
              >
                Sign in
              </Link>
            </CardFooter>
          ),
        },
        Message: {
          Root: (props: OryMessageRootProps) => (
            <div {...props} className="grid gap-6 pb-4" />
          ),
          Content: (props: OryMessageContentProps) => (
            <p
              {...props}
              className={cn(
                'grid gap-6 text-wrap text-sm text-muted-foreground',
                props.message.type === 'error' && 'text-destructive',
              )}
            >
              {props.message.text}
            </p>
          ),
        },
        Form: {
          Group: (props: OryFormGroupProps) => (
            <div
              {...props}
              className={cn(
                'grid gap-6',
                '[&_input]:flex [&_input]:h-10 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-input [&_input]:bg-background [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:ring-offset-background',
                // '[&_input[type=file]]:border-0 [&_input[type=file]]:bg-transparent [&_input[type=file]]:text-sm [&_input[type=file]]:font-medium',
                // '[&_input]:placeholder:text-muted-foreground',
                // '[&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-ring [&_input]:focus-visible:ring-offset-2',
                // '[&_input]:disabled:cursor-not-allowed [&_input]:disabled:opacity-50',
              )}
            />
          ),
        },
        Node: {
          Button: (props: OryNodeButtonProps) => (
            <Button
              {...props}
              key={props.attributes.name}
              type={props.attributes.type as 'submit' | 'button' | 'reset'}
            >
              {props.node.meta.label?.text}
            </Button>
          ),
          SsoButton: (props: OryNodeSsoButtonProps) => {
            const fullProviderId = (props.node?.meta?.label as SsoLabel)
              ?.context?.provider_id
            const providerIdParts = fullProviderId?.split('-')
            const providerId = providerIdParts?.[0]
            const providerIdExtension = providerIdParts?.[1]
            if (providerIdExtension && providerIdExtension === 'extended') {
              return null
            }
            const Icon = providerId
              ? ProviderIcons[providerId as keyof typeof ProviderIcons]
              : undefined
            const IconColor = providerId
              ? ProviderIconHex[providerId as keyof typeof ProviderIconHex]
              : undefined
            return (
              <Button
                {...props}
                key={providerId}
                variant={fullProviderId ? 'secondary' : 'default'}
                type={props.attributes.type as 'submit' | 'button' | 'reset'}
              >
                <div className="flex items-center justify-center gap-2">
                  {Icon && <Icon color={IconColor} />}
                  {props.node.meta.label?.text}
                </div>
              </Button>
            )
          },
          Label: (props: OryNodeLabelProps) => {
            if (
              ['traits.username', 'traits.avatar_url'].includes(
                props.attributes.name,
              )
            ) {
              return null
            }
            return (
              <div key={props.attributes.name} className="grid gap-2">
                <Label {...props.attributes} htmlFor={props.attributes.name}>
                  {props.node.meta.label?.text}
                </Label>
                {props.children}
                {props.node.messages.map((message) => (
                  <p
                    key={message.id}
                    className={cn(
                      'text-xs text-muted-foreground',
                      message.type === 'error' && 'text-destructive',
                    )}
                  >
                    {message.text}
                  </p>
                ))}
              </div>
            )
          },
        },
      }}
    />
  )
}
