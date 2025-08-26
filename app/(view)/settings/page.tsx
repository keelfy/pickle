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
import { parseAsStringEnum, useQueryState } from 'nuqs'
import {
  getSettingsGroupLabel,
  getSettingsTabLabel,
  SettingsTab,
  tabCategories,
} from './page.logic'
import { default as ProfileSettingsTabButton } from './tab-button'
import TabContent from './tab-content'

const SettingsPage: NextPage = () => {
  const [currentTab, setCurrentTab] = useQueryState(
    'tab',
    parseAsStringEnum(Object.values(SettingsTab)),
  )

  return (
    <div className="flex flex-col gap-8 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbLink
            href="/settings"
            className="flex items-center gap-1 text-lg"
          >
            <SettingsIcon className="size-4" />
            Settings
          </BreadcrumbLink>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {getSettingsGroupLabel(currentTab ?? SettingsTab.General)}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>
            {getSettingsTabLabel(currentTab ?? SettingsTab.General)}
          </BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>
      <TooltipProvider>
        <div className="flex space-x-6">
          <div className="flex flex-col space-y-2">
            {tabCategories.map((category) => (
              <div key={category.name} className="flex flex-col space-y-2">
                <h2 className="text-xs text-muted-foreground">
                  {category.name}
                </h2>
                <div className="flex flex-col space-y-2">
                  {category.tabs.map((tab) => (
                    <ProfileSettingsTabButton
                      key={tab.value}
                      active={tab.value === currentTab}
                      onClick={() => setCurrentTab(tab.value)}
                      icon={tab.icon}
                      label={tab.label}
                      disabled={tab.disabled}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <TabContent tab={currentTab ?? SettingsTab.General} />
        </div>
      </TooltipProvider>
      <TrackTwitchChannelRewardDialog />
    </div>
  )
}

export default SettingsPage
