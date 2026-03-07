import LoadingSpinner from '@/components/ui/loading-spinner'

export default function Loading() {
  return (
    <div className="flex h-svh w-screen items-center justify-center">
      <LoadingSpinner type="bars" />
    </div>
  )
}
