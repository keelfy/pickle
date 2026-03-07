import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/ui/loading-spinner'
import LoadingDialogContent from '@/components/view/dialog/loading-dialog-content'
import {
  useImportRedemptionsMutation,
  useSaveTwitchPreferencesMutation,
  useTwitchPreferences,
} from '@/hooks/mutations/use-twitch-mutations'
import { ContentCategory } from '@/lib/model/content'
import { toastError } from '@/lib/toasts'
import { useIsDesktop } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import {
  TrackedRewardReq,
} from '@/utils/api/request'
import { BroadcasterPreferences, TwitchChannelReward } from '@/utils/api/types'
import {
  AlertCircleIcon,
  CheckIcon,
  LinkIcon,
  PlugIcon,
  SaveIcon,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import React from 'react'
import ChannelRewardItem from './channel-reward-item'

const DynamicTrackTwitchChannelRewardDialogContent = dynamic(
  () => import('./track-twitch-reward-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export default function TwitchIntegrationSettings() {
  const [preferences, setPreferences] = React.useState<BroadcasterPreferences>()
  const { data: fetchedPreferences, error: preferencesError } = useTwitchPreferences()
  const savePreferencesMutation = useSaveTwitchPreferencesMutation()
  const importRedemptionsMutation = useImportRedemptionsMutation()
  const isDesktop = useIsDesktop()
  const [trackingStatus, setTrackingStatus] = React.useState<
    'healthy' | 'issues' | 'loading'
  >('loading')
  const [isPending, startTransition] = React.useTransition()

  const [isImporting, startImporting] = React.useTransition()
  const [isTrackRewardDialogOpen, setIsTrackRewardDialogOpen] =
    React.useState(false)

  React.useEffect(() => {
    if (fetchedPreferences) {
      setPreferences(fetchedPreferences)
      setTrackingStatus(fetchedPreferences.rewards.isActive ? 'healthy' : 'issues')
    }
  }, [fetchedPreferences])

  React.useEffect(() => {
    if (preferencesError) {
      setTrackingStatus('issues')
      toastError('Failed to load twitch preferences', preferencesError)
    }
  }, [preferencesError])

  const savePreferences = () =>
    startTransition(async () => {
      if (!preferences?.rewards.trackedRewards) return
      const trackedRewards = preferences?.rewards.trackedRewards.map(
        (r) =>
          ({
            rewardId: r.id,
            category: r.category || 'any',
          }) as TrackedRewardReq,
      )
      try {
        await savePreferencesMutation.mutateAsync(trackedRewards)
      } catch (e) {
        toastError('Failed to save preferences', e)
      }
    })

  const handleImportRedemptions = () =>
    startImporting(async () => {
      try {
        await importRedemptionsMutation.mutateAsync()
      } catch (e) {
        toastError('Failed to import redemptions', e)
      }
    })

  const handleTrackReward = (reward: TwitchChannelReward) => {
    setPreferences(
      (prev) =>
        prev && {
          ...prev,
          rewards: {
            ...prev.rewards,
            trackedRewards: [
              ...prev.rewards.trackedRewards,
              {
                ...reward,
                category: 'any',
              },
            ],
          },
        },
    )
    setIsTrackRewardDialogOpen(false)
  }

  const handleUntrackReward = (reward: TwitchChannelReward) => {
    setPreferences(
      (prev) =>
        prev && {
          ...prev,
          rewards: {
            ...prev.rewards,
            trackedRewards: prev.rewards.trackedRewards.filter(
              (r) => r.id !== reward.id,
            ),
          },
        },
    )
  }

  const handleChangeCategory = (
    reward: TwitchChannelReward,
    category: ContentCategory | undefined,
  ) => {
    setPreferences(
      (prev) =>
        prev && {
          ...prev,
          rewards: {
            ...prev.rewards,
            trackedRewards: prev.rewards.trackedRewards.map((r) =>
              r.id === reward.id ? { ...r, category } : r,
            ),
          },
        },
    )
  }

  const DialogWrapper = isDesktop ? Dialog : Drawer
  const DialogWrapperContent = isDesktop ? DialogContent : DrawerContent

  return (
    <DialogWrapper
      open={isTrackRewardDialogOpen}
      onOpenChange={() => setIsTrackRewardDialogOpen(false)}
    >
      <Card>
        <div className="relative">
          <div
            className={cn(
              'group absolute right-0 top-0 z-10 flex h-9 flex-nowrap items-center gap-2 rounded-bl-md border-b border-l p-4',
              trackingStatus === 'healthy' && 'animate-pulse',
            )}
          >
            <Label className="text-sm">
              {['loading', 'healthy'].includes(trackingStatus)
                ? 'Tracking is healthy'
                : 'Tracking issues detected'}
            </Label>
            {trackingStatus === 'issues' ? (
              <AlertCircleIcon className="size-4 text-destructive" />
            ) : (
              <CheckIcon className="size-4 text-green-500" />
            )}
          </div>
        </div>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <PlugIcon className="size-4" />
              <p>Tracked Rewards</p>
            </div>
          </CardTitle>
          <CardDescription>
            You can start to track reward redemptions by clicking the link
            button next to an available reward in the&nbsp;
            <span className="font-bold">Available Rewards</span> section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {preferences?.rewards.trackedRewards &&
            preferences.rewards.trackedRewards.length > 0 ? (
              preferences.rewards.trackedRewards.map(
                (reward: TwitchChannelReward) => (
                  <ChannelRewardItem
                    key={reward.id}
                    reward={reward}
                    isPending={isPending}
                    handleClick={handleUntrackReward}
                    isTracked={true}
                    handleChangeCategory={handleChangeCategory}
                  />
                ),
              )
            ) : (
              <p className="flex h-48 items-center justify-center text-center text-sm">
                No rewards are currently being tracked 😔
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => setIsTrackRewardDialogOpen(true)}
            >
              <LinkIcon className="size-4" />
              Track new reward
            </Button>
            <Button onClick={savePreferences} disabled={isPending}>
              {isPending ? <LoadingSpinner /> : <SaveIcon className="size-4" />}
              Save changes
            </Button>
          </div>
        </CardFooter>
      </Card>
      {isTrackRewardDialogOpen && (
        <DialogWrapperContent
          className={cn(isDesktop && 'max-h-svh overflow-y-auto')}
        >
          <DynamicTrackTwitchChannelRewardDialogContent
            isDesktop={isDesktop}
            handleRewardClick={handleTrackReward}
          />
        </DialogWrapperContent>
      )}
    </DialogWrapper>
  )
}
