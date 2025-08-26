'use client'

import { Button } from '@/components/ui/button'
import {
  DialogWrapperDescription,
  DialogWrapperHeader,
  DialogWrapperTitle,
} from '@/components/ui/dialog-wrapper'
import { fetchAvailableTwitchRewards } from '@/hooks/api-endpoints-client'
import { toastError } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { TwitchChannelReward } from '@/utils/api/types'
import { ArrowRightIcon, PackageIcon, PlusIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

type Props = {
  isDesktop: boolean | undefined
}

export default function TrackTwitchRewardDialogContent({ isDesktop }: Props) {
  const [availableRewards, setAvailableRewards] = React.useState<
    TwitchChannelReward[]
  >([])

  const [isLoading, startTransition] = React.useTransition()

  React.useEffect(() => {
    startTransition(async () => {
      try {
        const rewards = await fetchAvailableTwitchRewards()
        setAvailableRewards(rewards)
      } catch (error) {
        toastError('Failed to load available rewards', error)
      }
    })
  }, [])

  return (
    <>
      <DialogWrapperHeader isDesktop={isDesktop}>
        <DialogWrapperTitle isDesktop={isDesktop}>
          <div className="flex items-center gap-2">
            <PackageIcon className="size-4" />
            Channel Rewards
          </div>
        </DialogWrapperTitle>
        <DialogWrapperDescription isDesktop={isDesktop}>
          Select a reward to track it and automatically add redemptions to your
          profile as content suggestions.
        </DialogWrapperDescription>
      </DialogWrapperHeader>
      <div className="flex flex-col gap-4">
        {availableRewards.map((reward) => (
          <Button
            key={reward.id}
            variant="secondary"
            size="lg"
            className="group px-4"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src={reward.image}
                  alt={reward.title}
                  width={28}
                  height={28}
                  className="size-[28px] rounded-md"
                  unoptimized
                />
                <p>
                  <span
                    style={{ color: reward.backgroundColor }}
                    className="text-md"
                  >
                    {reward.title}
                  </span>
                  &nbsp;
                  <span className="text-xs text-muted-foreground">
                    ({reward.cost})
                  </span>
                </p>
              </div>
              <ArrowRightIcon className="size-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </div>
          </Button>
        ))}
        {availableRewards.length === 0 && !isLoading && (
          <p className="my-4 text-center text-sm">
            There are no rewards available on your channel.
          </p>
        )}
        <Button className={cn(availableRewards.length > 0 && 'mt-4')} disabled>
          <PlusIcon className="size-4" />
          Create a new reward
        </Button>
      </div>
    </>
  )
}
