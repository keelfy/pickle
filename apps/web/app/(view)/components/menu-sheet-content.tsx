import ProfileAvatar from '@/components/profile-avatar'
import PickleLogo from '@/components/ui/icons/pickle-logo'
import { Separator } from '@/components/ui/separator'
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { User } from '@/lib/model/user'
import {
  MessageCircleIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import LanguageSelectButton from './language-select-button'
import MenuSheetSignInButton from './menu-sheet-sign-in-btn'
import MenuSheetSignOutButton from './menu-sheet-sign-out-btn'
import ThemeSelectButton from './theme-select-button'
import { cn } from '@/lib/utils'

const menuItems = [
  [
    {
      label: 'Following',
      href: '/following',
      icon: UserIcon,
      disabled: true,
    },
    {
      label: 'Browse',
      href: '/browse',
      icon: SearchIcon,
      disabled: true,
    },
  ],
  [
    {
      label: 'Settings',
      href: '/settings',
      icon: SettingsIcon,
    },
    {
      label: 'Support',
      href: '/support',
      icon: MessageCircleIcon,
      disabled: true,
    },
  ],
]

type Props = {
  user: User | undefined
}

export default function MenuSheetContent({ user }: Props) {
  return (
    <SheetContent className="flex flex-col gap-6">
      <SheetHeader>
        <SheetTitle>
          {user ? (
            <Link
              href={`/${user?.username}`}
              className="flex items-center gap-4"
            >
              <ProfileAvatar
                avatarUrl={user?.avatarUrl}
                size="md"
                className="h-8 w-8"
              />
              <div className="text-md">{user?.displayName}</div>
            </Link>
          ) : (
            <PickleLogo className="w-16" />
          )}
        </SheetTitle>
        <SheetDescription className="sr-only">Menu</SheetDescription>
      </SheetHeader>
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex flex-col gap-6">
          {menuItems.map((items, index) => (
            <div className="flex flex-col gap-4" key={index}>
              {items.map((item) => (
                <Link
                  href={item.href}
                  key={item.label}
                  className={cn(
                    'flex items-center gap-2 text-lg font-medium',
                    item.disabled &&
                      'pointer-events-none text-muted-foreground opacity-70',
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              ))}
              {index < menuItems.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <LanguageSelectButton />
            <ThemeSelectButton />
          </div>
          {!user ? <MenuSheetSignInButton /> : <MenuSheetSignOutButton />}
        </div>
      </div>
    </SheetContent>
  )
}
