'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { TooltipProvider } from '@/components/ui/tooltip'
import TrackTwitchChannelRewardDialog from '@/components/view/dialog/track-twitch-reward/track-twitch-reward-dialog'
import { SettingsIcon } from 'lucide-react'
import { NextPage } from 'next'
import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import {
  getSettingsGroupLabelKey,
  SettingsTab,
  tabCategories,
} from './page.logic'
import { default as ProfileSettingsTabButton } from './tab-button'
import TabContent from './tab-content'

const SettingsPage: NextPage = () => {
  const t = useTranslations('settings')
  const [currentTab, setCurrentTab] = useQueryState(
    'tab',
    parseAsStringEnum(Object.values(SettingsTab)),
  )
  const activeTab = currentTab ?? SettingsTab.General

  return (
    <div className="flex flex-col gap-8 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbLink
            href="/settings"
            className="flex items-center gap-1 text-lg"
          >
            <SettingsIcon className="size-4" />
            {t('title')}
          </BreadcrumbLink>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {t(`groups.${getSettingsGroupLabelKey(activeTab)}`)}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>
            {t(`tabs.${activeTab.toLowerCase()}`)}
          </BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>
      <TooltipProvider>
        <div className="flex space-x-6">
          <div className="flex flex-col space-y-2">
            {tabCategories.map((category) => (
              <div key={category.nameKey} className="flex flex-col space-y-2">
                <h2 className="text-xs text-muted-foreground">
                  {t(`groups.${category.nameKey}`)}
                </h2>
                <div className="flex flex-col space-y-2">
                  {category.tabs.map((tab) => (
                    <ProfileSettingsTabButton
                      key={tab.value}
                      active={tab.value === currentTab}
                      onClick={() => setCurrentTab(tab.value)}
                      icon={tab.icon}
                      label={t(`tabs.${tab.value.toLowerCase()}`)}
                      disabled={tab.disabled}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <TabContent tab={activeTab} />
        </div>
      </TooltipProvider>
      <TrackTwitchChannelRewardDialog />
    </div>
  )
}

export default SettingsPage
