import { useAuthStore } from '@/providers/auth-store'
import dynamic from 'next/dynamic'
import { SettingsTab } from './page.logic'
import TabLoading from './tab-loading'

const DynamicGeneralSettingsTab = dynamic(
  () => import('./general-tab/general-settings-tab'),
  { loading: () => <TabLoading /> },
)

const DynamicSecuritySettingsTab = dynamic(
  () => import('./security-tab/security-settings-tab'),
  { loading: () => <TabLoading /> },
)

const DynamicTwitchSettingsTab = dynamic(
  () => import('./twitch-integration-tab/twitch-settings-tab'),
  { loading: () => <TabLoading /> },
)

const DynamicModerationSettingsTab = dynamic(
  () => import('./moderation-tab/moderation-settings-tab'),
  { loading: () => <TabLoading /> },
)

const DynamicSuggestionsSettingsTab = dynamic(
  () => import('./suggestions-tab/suggestions-settings-tab'),
  { loading: () => <TabLoading /> },
)

type Props = { tab: SettingsTab }

export default function TabContent({ tab }: Props) {
  const user = useAuthStore((state) => state.user)
  if (!user) return null

  switch (tab) {
    case SettingsTab.General:
      return <DynamicGeneralSettingsTab />
    case SettingsTab.Security:
      return <DynamicSecuritySettingsTab />
    case SettingsTab.Moderation:
      return <DynamicModerationSettingsTab />
    case SettingsTab.Notifications:
      return <div />
    case SettingsTab.Suggestions:
      return <DynamicSuggestionsSettingsTab />
    case SettingsTab.Payments:
      return <div />
    case SettingsTab.TwitchIntegration:
      return <DynamicTwitchSettingsTab />
  }

  return <div />
}
