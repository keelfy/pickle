'use client'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/providers/auth-store'
import { ModalType } from '@/stores/modal'
import { Profile } from '@/lib/model/user'
import Link from 'next/link'

type Props = { profile: Profile }

export default function OrdersDisabledSection({ profile }: Props) {
  const user = useAuthStore((state) => state.user)
  const isOwner = user !== undefined && user?.id == profile.id

  return (
    <div className="grid justify-items-center gap-4">
      <div className="text-sm font-medium">
        Suggestions are disabled for {profile.username}.
      </div>
      {isOwner && (
        <Button variant="link" size="sm" asChild>
          <Link
            href={`/${user.username}?modal=${ModalType.ProfileSettings}&modalParams=tab=suggestions`}
          >
            You can enable this feature here.
          </Link>
        </Button>
      )}
    </div>
  )
}
