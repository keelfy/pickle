import {
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import LoadingSpinner from '@/components/ui/loading-spinner'

export default function LoadingAlertDialogContent() {
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Loading...</AlertDialogTitle>
      </AlertDialogHeader>
      <div className="flex h-32 items-center justify-center">
        <LoadingSpinner />
      </div>
    </>
  )
}
