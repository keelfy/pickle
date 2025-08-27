'use client'

import { Button } from '@/components/ui/button'
import {
  DialogWrapperHeader,
  DialogWrapperTitle,
} from '@/components/ui/dialog-wrapper'
import { getShortenedCount } from '@/lib/count-shortener'
import { ProfileLink } from '@/lib/model/user'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/providers/profile-store'
import {
  AlertTriangleIcon,
  CalendarIcon,
  GamepadIcon,
  ShoppingBagIcon,
  TvIcon,
} from 'lucide-react'
import DetailedProfileLink from './detailed-profile-link'

type Props = {
  isDesktop: boolean | undefined
}

export default function ShowMoreProfileDialogContent({ isDesktop }: Props) {
  const profile = useProfileStore((state) => state.profile)

  return (
    <>
      <DialogWrapperHeader isDesktop={isDesktop}>
        <DialogWrapperTitle isDesktop={isDesktop}>
          {profile?.username}
        </DialogWrapperTitle>
      </DialogWrapperHeader>

      <div className="flex flex-col gap-4 p-6 lg:p-0">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p
            className={cn(
              profile?.description?.length === 0 && 'text-muted-foreground',
            )}
          >
            {profile?.description?.length === 0
              ? 'No description provided.'
              : (profile?.description ?? '')}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Links</h2>
          <div className="flex flex-col gap-1">
            {profile?.socialLinks && profile?.socialLinks.length > 0 ? (
              profile?.socialLinks.map((link: ProfileLink) => (
                <DetailedProfileLink key={link.url} link={link} />
              ))
            ) : (
              <p className="text-muted-foreground">No links provided.</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Additional Information</h2>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4" />
              <p>
                Registered on&nbsp;
                {profile?.createdAt &&
                  new Date(profile.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <GamepadIcon className="size-4" />
              <p>
                Games played:&nbsp;
                {getShortenedCount(profile?.counts?.played ?? 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TvIcon className="size-4" />
              <p>
                Movies, series and anime watched:&nbsp;
                {getShortenedCount(profile?.counts?.watched ?? 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBagIcon className="size-4" />
              <p>
                Orders made:&nbsp;
                {getShortenedCount(profile?.counts?.ordered ?? 0)}
              </p>
            </div>
            {/* <div className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              <p>213123 unique profile visits</p>
            </div> */}
          </div>
        </div>
        <Button variant="destructive" className="w-min self-end">
          <AlertTriangleIcon className="size-4" />
          Report profile
        </Button>
      </div>
    </>
  )
}
