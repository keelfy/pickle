import { getProfileLinkIcon } from '@/lib/profile-link-icon'
import { cn } from '@/lib/utils'
import { ProfileLink } from '@/lib/model/user'

export default function DetailedProfileLink({ link }: { link: ProfileLink }) {
  const { Icon, IconHex, invertOnDarkTheme } = getProfileLinkIcon(link)
  const url = new URL(link.url)
  const hostname = url.hostname
  const pathname = url.pathname
  const pathnameWithoutSlash = pathname.replace(/^\//, '')
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <div className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted/50">
        <Icon
          className={cn('size-6', invertOnDarkTheme && 'dark:invert')}
          color={IconHex}
        />
        <div className="flex flex-col">
          <span className="line-clamp-1 underline-offset-2">{link.name}</span>
          <span className="text-xs text-muted-foreground">
            {hostname}/{pathnameWithoutSlash}
          </span>
        </div>
      </div>
    </a>
  )
}
