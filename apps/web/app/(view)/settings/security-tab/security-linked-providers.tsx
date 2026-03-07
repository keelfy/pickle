import YandexIcon from '@/components/ui/icons/yandex-icon'
import { SiDiscord, SiGoogle, SiTwitch } from '@icons-pack/react-simple-icons'
import { SettingsFlow } from '@ory/client-fetch'
import ProviderIdentityElement from './identity-element'

type Props = {
  flow: SettingsFlow | undefined
  updateFlow: (flow: SettingsFlow) => void
  isFlowLoading: boolean
}

const getProviderIcon = (
  providerType: string,
): React.ComponentType<{ className?: string }> | null => {
  const type = providerType.split('-')[0]
  switch (type) {
    case 'google':
      return SiGoogle
    case 'twitch':
      return SiTwitch
    case 'discord':
      return SiDiscord
    case 'yandex':
      return YandexIcon
    default:
      return null
  }
}

const getProviderColor = (providerType: string): string => {
  const type = providerType.split('-')[0]
  switch (type) {
    case 'google':
      return '4285F4'
    case 'twitch':
      return '6441A5'
    case 'discord':
      return '7289DA'
    case 'yandex':
      return 'ff0000'
    default:
      return 'ffffff'
  }
}

export default function SecurityLinkedProviders({
  flow,
  updateFlow,
  isFlowLoading,
}: Props) {
  const IdentityElement = ({
    providerName,
    providerType,
  }: {
    providerName: string
    providerType: string
  }) => {
    return (
      <ProviderIdentityElement
        key={providerType}
        providerType={providerType}
        providerName={providerName}
        providerIcon={getProviderIcon(providerType)}
        providerColor={getProviderColor(providerType)}
        flow={flow}
        updateFlow={updateFlow}
        isFlowLoading={isFlowLoading}
      />
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      <h2 className="text-lg font-semibold">Linked accounts</h2>

      <IdentityElement providerName="Google" providerType="google" />
      <IdentityElement providerName="Twitch" providerType="twitch-basic" />
      <IdentityElement providerName="Discord" providerType="discord" />
      <IdentityElement providerName="Yandex" providerType="yandex" />
    </div>
  )
}
