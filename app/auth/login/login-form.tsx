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
import PickleIcon from '@/components/ui/icons/pickle-icon'
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
import { LoginFlow } from '@ory/client-fetch'
import {
  OryCardContentProps,
  OryFormGroupProps,
  OryMessageContentProps,
  OryMessageRootProps,
  OryNodeButtonProps,
  OryNodeInputProps,
  OryNodeLabelProps,
  OryNodeSsoButtonProps,
} from '@ory/elements-react'
import { Login } from '@ory/elements-react/theme'
import Link from 'next/link'
import { PropsWithChildren } from 'react'

type Props = {
  flow: LoginFlow
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

export function LoginForm({ flow }: Props) {
  console.log(flow)
  return (
    <Login
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
                Sign In
                <PickleLogo className="h-5" />
              </CardTitle>
              <CardDescription>
                Sign in with your email and password or a social provider
              </CardDescription>
            </CardHeader>
          ),
          Divider: () => <div />,
          Content: (props: OryCardContentProps) => (
            <CardContent>{props.children}</CardContent>
          ),
          Footer: () => (
            <CardFooter>
              Don&apos;t have an account?&nbsp;
              <Link
                href={{
                  pathname: `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/registration/browser`,
                  query: {
                    return_to: flow?.return_to ?? '/',
                  },
                }}
                className="underline"
              >
                Sign up
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
            <div {...props} className="grid gap-6" />
          ),
        },
        Node: {
          Button: (props: OryNodeButtonProps) => (
            <Button
              {...props}
              type={props.attributes.type as 'submit' | 'button' | 'reset'}
            >
              {props.node.meta.label?.text}
            </Button>
          ),
          SsoButton: (props: OryNodeSsoButtonProps) => {
            const fullProviderId = (props.node?.meta?.label as SsoLabel)
              ?.context?.provider_id
            if (!fullProviderId) {
              return null
            }
            const providerIdParts = fullProviderId.split('-')
            const providerId = providerIdParts[0]
            const providerIdExtension = providerIdParts[1]
            if (providerIdExtension && providerIdExtension === 'extended') {
              return null
            }
            const Icon = ProviderIcons[providerId as keyof typeof ProviderIcons]
            const IconColor =
              ProviderIconHex[providerId as keyof typeof ProviderIconHex]
            return (
              <Button
                {...props}
                key={providerId}
                variant="secondary"
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
                <Label {...props.attributes}>
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
          Input: (props: OryNodeInputProps) => {
            return (
              <Input
                {...props}
                key={props.attributes.name}
                autoComplete={props.attributes.autocomplete ?? 'off'}
                defaultValue={props.attributes.value ?? ''}
                type={props.attributes.type as 'text' | 'email' | 'password'}
              />
            )
          },
        },
      }}
    />
  )
}
