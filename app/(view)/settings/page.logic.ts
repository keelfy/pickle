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
  label: string
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

export const tabCategories: { name: string; tabs: SettingsTabProps[] }[] = [
  {
    name: 'Profile',
    tabs: [
      { value: SettingsTab.General, icon: SettingsIcon, label: 'General' },
      {
        value: SettingsTab.Suggestions,
        icon: LightbulbIcon,
        label: 'Suggestions',
      },
      {
        value: SettingsTab.Moderation,
        icon: HandshakeIcon,
        label: 'Moderation',
      },
    ],
  },
  {
    name: 'Account',
    tabs: [
      { value: SettingsTab.Security, icon: ShieldIcon, label: 'Security' },
      {
        value: SettingsTab.Payments,
        icon: CreditCardIcon,
        label: 'Payments',
        disabled: true,
      },
      {
        value: SettingsTab.Notifications,
        icon: MessageCircleIcon,
        label: 'Notifications',
        disabled: true,
      },
    ],
  },
  {
    name: 'Integrations',
    tabs: [
      { value: SettingsTab.TwitchIntegration, icon: SiTwitch, label: 'Twitch' },
    ],
  },
]

export const getSettingsTabLabel = (tab: SettingsTab) => {
  switch (tab) {
    case SettingsTab.General:
      return 'General'
    case SettingsTab.Security:
      return 'Security'
    case SettingsTab.Notifications:
      return 'Notifications'
    case SettingsTab.Moderation:
      return 'Moderation'
    case SettingsTab.Suggestions:
      return 'Suggestions'
    case SettingsTab.Payments:
      return 'Payments'
    case SettingsTab.TwitchIntegration:
      return 'Twitch Integration'
    default:
      return tab
  }
}

export const getSettingsGroupLabel = (tab: SettingsTab) => {
  switch (tab) {
    case SettingsTab.General:
    case SettingsTab.Moderation:
    case SettingsTab.Suggestions:
      return 'Profile'
    case SettingsTab.Security:
    case SettingsTab.Payments:
    case SettingsTab.Notifications:
      return 'Account'
    case SettingsTab.TwitchIntegration:
      return 'Integrations'
    default:
      return tab
  }
}
