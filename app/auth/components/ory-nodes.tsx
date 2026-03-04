import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  isUiNodeInputAttributes,
  LoginFlow,
  RegistrationFlow,
  UiNode,
  UiNodeGroupEnum,
  UiNodeInputAttributes,
} from '@ory/client-fetch'
import ProviderIcon from './provider-icon'

export const groupUiNodes = (
  nodes: UiNode[],
): Record<UiNodeGroupEnum, UiNode[]> => {
  return nodes.reduce(
    (acc, node) => {
      const group = node.group ?? UiNodeGroupEnum.Default
      const assigned =
        group === UiNodeGroupEnum.Oidc
          ? UiNodeGroupEnum.Oidc
          : UiNodeGroupEnum.Default
      if (!acc[assigned]) {
        acc[assigned] = []
      }
      acc[assigned].push(node)
      return acc
    },
    {} as Record<UiNodeGroupEnum, UiNode[]>,
  )
}

export const mapUiNodeGroups = (
  flow: LoginFlow | RegistrationFlow,
  groups: Record<UiNodeGroupEnum, UiNode[]>,
) => {
  return Object.entries(groups).map(([group, nodes]) => {
    return (
      <div
        key={group}
        className={cn(
          'grid grid-cols-1 gap-4 py-2',
          group === 'oidc' && 'grid-cols-2 gap-2',
        )}
      >
        {nodes.map((node) => mapUiNode(flow, node))}
      </div>
    )
  })
}

export const mapUiNode = (
  flow: LoginFlow | RegistrationFlow | undefined,
  node: UiNode,
) => {
  const active = flow?.active !== undefined
  if (!isUiNodeInputAttributes(node.attributes)) return null

  const attrs = node.attributes as UiNodeInputAttributes
  const nodeType = attrs.type
  const provider = (node.meta.label?.context as { provider: string })?.provider

  // skip extended providers (e.g. twitch-extended)
  if (provider && attrs.value?.toLowerCase().includes('extended')) {
    return null
  }

  if (['traits.username', 'traits.avatar_url'].includes(attrs.name)) {
    return null
  }

  switch (nodeType) {
    case 'email':
    case 'text':
    case 'password':
    case 'hidden':
      return (
        <div className="grid gap-2">
          <Label hidden={attrs.type === 'hidden'} htmlFor={attrs.name}>
            {node.meta.label?.text}
          </Label>
          <Input
            type={attrs.type}
            required={attrs.required}
            name={attrs.name}
            disabled={attrs.disabled}
            maxLength={attrs.maxlength}
            autoComplete={attrs.autocomplete}
            defaultValue={attrs.value}
          />
          {node.messages?.map((message) => (
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
    case 'button':
    case 'submit':
      return (
        <Button
          variant={attrs.type === 'submit' ? 'default' : 'secondary'}
          className="flex w-full items-center gap-2 px-2"
          value={attrs.value}
          disabled={attrs.disabled}
          name={attrs.name}
          type={attrs.type as 'submit' | 'button' | 'reset' | undefined}
        >
          {attrs.name === 'provider' && <ProviderIcon providerId={provider} />}
          {node.meta.label?.text}
        </Button>
      )
  }
}
