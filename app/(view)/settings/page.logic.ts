import { SiTwitch } from '@icons-pack/react-simple-icons'
import {
  CreditCardIcon,
  HandshakeIcon,
  LightbulbIcon,
  MessageCircleIcon,
  SettingsIcon,
  ShieldIcon,
} from 'lucide-react'

export type SettingsTabProps = {
  value: SettingsTab
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export enum SettingsTab {
  General = 'general',
  Security = 'security',
  Notifications = 'notifications',
  Moderation = 'moderation',
  Suggestions = 'suggestions',
  Payments = 'payments',
  TwitchIntegration = 'twitch-integration',
}

export type SettingsGroup = 'profile' | 'account' | 'integrations'

export const tabCategories: { nameKey: SettingsGroup; tabs: SettingsTabProps[] }[] =
  [
  {
    nameKey: 'profile',
    tabs: [
      {
        value: SettingsTab.General,
        icon: SettingsIcon,
      },
      {
        value: SettingsTab.Suggestions,
        icon: LightbulbIcon,
      },
      {
        value: SettingsTab.Moderation,
        icon: HandshakeIcon,
      },
    ],
  },
  {
    nameKey: 'account',
    tabs: [
      {
        value: SettingsTab.Security,
        icon: ShieldIcon,
      },
      {
        value: SettingsTab.Payments,
        icon: CreditCardIcon,
        disabled: true,
      },
      {
        value: SettingsTab.Notifications,
        icon: MessageCircleIcon,
        disabled: true,
      },
    ],
  },
  {
    nameKey: 'integrations',
    tabs: [
      {
        value: SettingsTab.TwitchIntegration,
        icon: SiTwitch,
      },
    ],
  },
]

export const getSettingsGroupLabelKey = (tab: SettingsTab): SettingsGroup => {
  switch (tab) {
    case SettingsTab.General:
    case SettingsTab.Moderation:
    case SettingsTab.Suggestions:
      return 'profile'
    case SettingsTab.Security:
    case SettingsTab.Payments:
    case SettingsTab.Notifications:
      return 'account'
    case SettingsTab.TwitchIntegration:
      return 'integrations'
    default:
      return 'profile'
  }
}
