import LanguageDropdownMenu from '@/components/language-dropdown-menu'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import PickleLogo from '@/components/ui/icons/pickle-logo'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { fetchUser } from '@/hooks/api-endpoints-server'
import { DetailedUser } from '@/lib/model/user'
import { cn } from '@/lib/utils'
import { Bell, MenuIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import MenuItemUnderline from './[username]/menu-item-underline'
import ProfileDropdownMenu from './profile-dropdown-menu'

const DynamicMenuSheetContent = dynamic(
  () => import('./components/menu-sheet-content'),
  {
    ssr: true,
  },
)

type Props = {
  className?: string
}

const MENU_ITEMS = [
  {
    href: `/following`,
    label: `Following`,
    disabled: true,
  },
  {
    href: `/browse`,
    label: `Browse`,
    disabled: true,
  },
]

export default async function Navbar({ className }: Props) {
  let user: DetailedUser | undefined = undefined

  try {
    user = await fetchUser('md')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // do nothing
  }

  return (
    <Sheet>
      <nav className={cn('flex items-center justify-between', className)}>
        <div className="flex items-center gap-4">
          <Link href="/">
            <PickleLogo className="w-24 lg:mr-6" />
          </Link>
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              {MENU_ITEMS.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <MenuItemUnderline key={item.href} href={item.href}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        item.disabled && 'pointer-events-none opacity-50',
                      )}
                      asChild
                    >
                      <Link href={item.href} passHref>
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </MenuItemUnderline>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex items-center gap-4">
            {/* <CurrentDate /> */}
            {/* <Separator orientation="vertical" className="h-8" /> */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon">
                <Bell />
              </Button>
              <LanguageDropdownMenu variant="short" />
              <ThemeSwitcher />
            </div>
          </div>
          <ProfileDropdownMenu user={user} />
        </div>

        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <MenuIcon />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
      </nav>
      <DynamicMenuSheetContent user={user} />
    </Sheet>
  )
}
