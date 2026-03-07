import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { KeyIcon, XIcon } from 'lucide-react'
import React from 'react'

type Props = {
  icon: React.ComponentType<{ className?: string }>
  title: React.ReactNode
  description: React.ReactNode
  tbd?: boolean
  action?: () => Promise<void>
  isLoading?: boolean
  isLinked?: boolean
}

export default function IntegrationElement({
  icon: Icon,
  title,
  description,
  tbd = false,
  action = () => Promise.resolve(),
  isLoading = false,
  isLinked = false,
}: Props) {
  const [isPending, startTransition] = React.useTransition()

  const handleClick = () => startTransition(async () => await action())

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex flex-1 flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 text-sm text-[#6441A5]`} />
          <div className="font-mono">{title}</div>
          {tbd && <p className="text-xs text-muted-foreground">TBD</p>}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={tbd || isLoading}
      >
        {isPending || isLoading ? (
          <LoadingSpinner />
        ) : isLinked ? (
          <XIcon className="h-4 w-4 text-destructive" />
        ) : (
          <KeyIcon className="h-4 w-4" />
        )}
        {isLinked ? 'Disconnect' : 'Connect'}
      </Button>
    </div>
  )
}
