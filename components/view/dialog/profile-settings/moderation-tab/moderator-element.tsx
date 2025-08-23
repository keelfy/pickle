import ProfileAvatar from '@/components/profile-avatar'
import { Button } from '@/components/ui/button'
import { fetchDeleteModerator } from '@/hooks/api-endpoints-client'
import { toast } from '@/hooks/use-toast'
import { getTimeAgoText } from '@/lib/localize-types'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/providers/auth-store'
import { Moderator } from '@/lib/model/moderator'
import { Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  moderator: Moderator
  isLoading?: boolean
  className?: string
  afterDelete?: () => void
}

export default function ModeratorElement({
  moderator,
  isLoading,
  afterDelete,
  className,
}: Props) {
  const profile = useAuthStore((state) => state.user)
  const [isDeleting, startDeleting] = React.useTransition()

  function onDelete() {
    if (!profile) return
    startDeleting(() =>
      fetchDeleteModerator(profile, moderator.id)
        .then(() => afterDelete?.())
        .catch((error) => {
          toast({
            title: 'Error deleting moderator',
            description:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred',
            variant: 'destructive',
          })
        }),
    )
  }

  const ModeratorUsernameButton = () => {
    return (
      <Button variant="link" className="h-fit w-fit p-0 text-start">
        {isLoading ? 'Loading...' : moderator.displayName}
      </Button>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-md border px-3 py-2',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <ProfileAvatar avatarUrl={moderator.avatarUrl} size="sm" />
        <div className="grid gap-0">
          {moderator.username ? (
            <Link
              href={`/${moderator.username}`}
              target="_blank"
              legacyBehavior
            >
              <ModeratorUsernameButton />
            </Link>
          ) : (
            <ModeratorUsernameButton />
          )}
          <p className="text-xs text-muted-foreground">
            Added {getTimeAgoText(moderator.addedAt)} ago by you
          </p>
        </div>
      </div>
      <Button
        variant="destructive"
        size="icon"
        disabled={isLoading || isDeleting}
        onClick={onDelete}
      >
        {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
        <span className="sr-only">Remove</span>
      </Button>
    </div>
  )
}
