'use client'

import DialogWrapper from '@/components/ui/dialog-wrapper'
import { useIsDesktop } from '@/lib/use-media-query'
import { ModalType } from '@/stores/modal'
import dynamic from 'next/dynamic'
import LoadingDialogContent from '../loading-dialog-content'

const DynamicShowMoreProfileDialogContent = dynamic(
  () => import('./show-more-profile-dialog-content'),
  {
    loading: () => <LoadingDialogContent />,
  },
)

export default function ShowMoreProfileDialog() {
  const isDesktop = useIsDesktop()
  return (
    <DialogWrapper modalType={ModalType.ShowMoreProfile} isDesktop={isDesktop}>
      <DynamicShowMoreProfileDialogContent isDesktop={isDesktop} />
    </DialogWrapper>
  )
}
