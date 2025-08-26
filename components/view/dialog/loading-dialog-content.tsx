import {
  DialogWrapperHeader,
  DialogWrapperTitle,
} from '@/components/ui/dialog-wrapper'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { useIsDesktop } from '@/lib/use-media-query'

export default function LoadingDialogContent() {
  const isDesktop = useIsDesktop()
  return (
    <>
      <DialogWrapperHeader isDesktop={isDesktop}>
        <DialogWrapperTitle isDesktop={isDesktop}>
          Loading...
        </DialogWrapperTitle>
      </DialogWrapperHeader>
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    </>
  )
}
