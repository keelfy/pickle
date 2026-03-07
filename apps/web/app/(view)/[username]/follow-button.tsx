'use client'

import { Button } from '@/components/ui/button'
import {
  useFollowProfileMutation,
  useUnfollowProfileMutation,
} from '@/hooks/mutations/use-follow-mutations'
import useRedirectToLogin from '@/hooks/use-redirect-to-login'
import { toastError } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/providers/auth-store'
import { useProfileStore } from '@/providers/profile-store'
import { HeartCrackIcon, HeartIcon } from 'lucide-react'
import React from 'react'

type Props = {
  className?: string
}

export function FollowButton({ className }: Props) {
  const { profile, update } = useProfileStore((state) => state)
  const user = useAuthStore((state) => state.user)
  const [isFollowing, setIsFollowing] = React.useState<boolean>(
    profile?.context?.isFollowing ?? false,
  )
  const [isHovering, setIsHovering] = React.useState<boolean>(false)
  const [isPending, startTransition] = React.useTransition()
  const followMutation = useFollowProfileMutation()
  const unfollowMutation = useUnfollowProfileMutation()
  const redirectToLogin = useRedirectToLogin()

  const handleFollow = () =>
    startTransition(async () => {
      if (!profile) {
        return
      }

      if (!user?.id) {
        redirectToLogin()
        return
      }

      const prevValue = isFollowing
      try {
        setIsFollowing(true)
        await followMutation.mutateAsync({ user: profile })

        if (profile?.counts) {
          const oldContext = profile?.context ?? {
            isFollowing: false,
            isAuthorized: false,
            isModerator: false,
          }
          update({
            ...profile,
            counts: {
              ...profile.counts,
              followers: profile.counts.followers + 1,
            },
            context: {
              ...oldContext,
              isFollowing: true,
            },
          })
        }
      } catch (error) {
        toastError('Failed to follow ' + profile?.displayName, error)
        setIsFollowing(prevValue)
      }
    })

  const handleUnfollow = () => {
    if (user?.id === profile?.id || !profile) {
      return
    }

    startTransition(async () => {
      const prevValue = isFollowing
      try {
        setIsFollowing(false)
        await unfollowMutation.mutateAsync({ user: profile })

        if (profile?.counts) {
          const oldContext = profile?.context ?? {
            isFollowing: false,
            isAuthorized: false,
            isModerator: false,
          }
          update({
            ...profile,
            counts: {
              ...profile.counts,
              followers: profile.counts.followers - 1,
            },
            context: {
              ...oldContext,
              isFollowing: false,
            },
          })
        }
      } catch (error) {
        toastError('Failed to unfollow ' + profile?.displayName, error)
        setIsFollowing(prevValue)
      }
    })
  }

  React.useEffect(() => {
    setIsFollowing(profile?.context?.isFollowing ?? false)
  }, [profile?.context?.isFollowing])

  if (profile?.id === user?.id) {
    return null
  }

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'default'}
      size="sm"
      className={className}
      onClick={isFollowing ? handleUnfollow : handleFollow}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isPending}
    >
      <div className="relative mx-2 text-red-500">
        <HeartIcon
          size={16}
          fill={isFollowing ? 'currentColor' : 'none'}
          strokeWidth={1.5}
          className={cn(
            'absolute -left-2 -top-2 h-4 w-4 opacity-100 transition-opacity duration-500',
            isHovering && isFollowing && 'opacity-0',
            isPending && 'animate-pulse',
          )}
        />
        <HeartCrackIcon
          size={16}
          strokeWidth={1.5}
          className={cn(
            'absolute -left-2 -top-2 h-4 w-4 opacity-0 transition-opacity duration-500',
            isHovering && isFollowing && 'opacity-100',
            isPending && 'animate-pulse',
          )}
        />
      </div>
      <p className="pr-2">{isFollowing ? 'Following' : 'Follow'}</p>
    </Button>
  )
}
