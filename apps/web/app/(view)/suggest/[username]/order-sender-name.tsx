'use client'

import ProfileAvatar from '@/components/profile-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/providers/auth-store'
import { CheckIcon, EditIcon, XIcon } from 'lucide-react'
import React from 'react'

type Props = {
  className?: string
  avatarUrl?: string
  onUsernameChange: (username: string) => void
  onAnonymouslyChange: (isAnonymously: boolean) => void
  isAnonymously: boolean
  allowedAnonymously: boolean
  username: string | undefined
}

export default function OrderSenderName({
  className,
  avatarUrl,
  onUsernameChange,
  onAnonymouslyChange,
  isAnonymously,
  allowedAnonymously,
  username,
}: Props) {
  const user = useAuthStore((state) => state.user)
  const [isEditing, setIsEditing] = React.useState<boolean>(false)
  const [typedName, setTypedName] = React.useState<string>(
    user?.displayName ?? '',
  )

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    handleChange()
  }

  const handleCancel = () => {
    setIsEditing(false)
    setTypedName(username ?? '')
  }

  const handleChange = () => {
    if (typedName?.length > 0) {
      onUsernameChange(typedName)
    } else if (user?.displayName !== undefined) {
      onUsernameChange(user.displayName)
      setTypedName(user.displayName)
    } else {
      onUsernameChange('')
      setTypedName('')
      onAnonymouslyChange(true)
    }
  }

  return (
    <div className="flex h-12 w-full items-center gap-2">
      <ProfileAvatar avatarUrl={avatarUrl} size="sm" />
      {isEditing ? (
        <div className="flex w-full items-center">
          <div className="relative flex-1">
            <Input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              onBlur={(e) => {
                // Don't call handleBlur if clicking the switch
                if (!e.relatedTarget?.closest('#anonymously')) {
                  handleBlur()
                }
              }}
              maxLength={25}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBlur()
                }
              }}
              disabled={!allowedAnonymously ? false : isAnonymously}
            />
            {allowedAnonymously && (
              <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                <label
                  htmlFor="anonymously"
                  className="text-sm text-muted-foreground"
                >
                  Anonymously?
                </label>
                <Switch
                  id="anonymously"
                  checked={!allowedAnonymously ? false : isAnonymously}
                  onCheckedChange={onAnonymouslyChange}
                  disabled={!allowedAnonymously}
                />
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={handleBlur}
          >
            <span className="sr-only">Save</span>
            <CheckIcon className="text-green-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <span className="sr-only">Cancel</span>
            <XIcon className="text-red-500" />
          </Button>
        </div>
      ) : (
        <Button
          variant="link"
          className={cn('flex items-center gap-2 p-0 text-start', className)}
          onClick={handleClick}
        >
          <div
            className={cn(
              username !== user?.displayName && !isAnonymously && 'italic',
              'underline decoration-muted-foreground decoration-dashed',
            )}
          >
            {isAnonymously
              ? 'Send anonymously'
              : username?.length == 0
                ? 'Someone'
                : username}
          </div>
          <EditIcon size="1rem" />
        </Button>
      )}
    </div>
  )
}
