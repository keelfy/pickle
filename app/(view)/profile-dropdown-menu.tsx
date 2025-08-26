import ProfileAvatar from '@/components/profile-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DropdownMenuDialogWrapper from '@/components/view/dialog/dropdown-menu-dialog-wrapper'
import TrackTwitchChannelRewardDialog from '@/components/view/dialog/track-twitch-reward/track-twitch-reward-dialog'
import getCurrentSession from '@/hooks/getCurrentSession'
import { DetailedUser } from '@/lib/model/user'
import { cn } from '@/lib/utils'
import { ModalType } from '@/stores/modal'
import { MessageCircle, Settings, UserIcon } from 'lucide-react'
import Link from 'next/link'
import LoggedOutProfileNavSection from './logged-out-nav-menu-button'
import DropdownMenuSignOutItem from './sign-out-button'

type Props = { className?: string; user: DetailedUser | undefined }

export default async function ProfileDropdownMenu({ className, user }: Props) {
  const session = await getCurrentSession()

  if (!session?.active) {
    return <LoggedOutProfileNavSection />
  }

  return (
    <DropdownMenuDialogWrapper>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="cursor-pointer transition-opacity hover:opacity-80">
          <ProfileAvatar
            avatarUrl={user?.avatarUrl}
            size="md"
            className={cn('h-12 w-12', className)}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col gap-0.5">
                <div className="text-md">{user?.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {session?.identity?.traits.email}
                </div>
              </div>
              <Badge>
                <UserIcon className="size-4" />
              </Badge>
            </div>

            <Button className="w-full" variant="secondary" asChild>
              <Link href={`/${user?.username}`}>My profile</Link>
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/settings">
                <Settings />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <MessageCircle />
              Support
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSignOutItem />
        </DropdownMenuContent>
      </DropdownMenu>
    </DropdownMenuDialogWrapper>
  )
}
