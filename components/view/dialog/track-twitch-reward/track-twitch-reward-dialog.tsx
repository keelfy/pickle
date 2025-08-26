'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useIsDesktop } from '@/lib/use-media-query'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicTrackTwitchChannelRewardDialogContent = dynamic(
  () => import('./track-twitch-reward-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export default function TrackTwitchChannelRewardDialog() {
  const isDesktop = useIsDesktop()
  return (
    <DialogWrapper
      modalType={ModalType.TrackTwitchChannelReward}
      isDesktop={isDesktop}
    >
      <DynamicTrackTwitchChannelRewardDialogContent isDesktop={isDesktop} />
    </DialogWrapper>
  )
}
