import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import { SettingsFlow } from '@ory/client-fetch'
import { ChevronsUpDownIcon } from 'lucide-react'
import PasswordChangeForm from './password-change-form'

type Props = {
  className?: string
  flow: SettingsFlow | undefined
  isFlowPending: boolean
  updateFlow: (flow: SettingsFlow) => void
}

export default function PasswordChangeElement({
  className,
  flow,
  isFlowPending,
  updateFlow,
}: Props) {
  return (
    <Collapsible>
      <div
        className={cn('flex items-center justify-between space-x-4', className)}
      >
        <div className="flex flex-1 flex-col space-y-2">
          <p className="flex items-center space-x-2">Password</p>
          <p className="text-xs text-muted-foreground">
            You can change your password at any time. We recommend using a
            strong password.
            {/* You don't have password set up. You can log in to this account only using third-party providers. */}
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-1"
            disabled={isFlowPending}
          >
            Change
            {isFlowPending ? <LoadingSpinner /> : <ChevronsUpDownIcon />}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <PasswordChangeForm
          className="mt-2"
          flow={flow}
          isFlowPending={isFlowPending}
          updateFlow={updateFlow}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
