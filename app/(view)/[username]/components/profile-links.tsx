import { ProfileLink } from '@/lib/model/user'
import { getProfileLinkIcon } from '@/lib/profile-link-icon'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Props = {
  links?: ProfileLink[]
}

export default function ProfileLinks({ links }: Props) {
  return links?.slice(0, 3).map((link: ProfileLink) => {
    const { Icon, IconHex, invertOnDarkTheme } = getProfileLinkIcon(link)
    return (
      <Link
        href={link.url}
        target="_blank"
        key={link.name}
        className="text-muted-foreground"
      >
        <div className="flex items-center gap-2 rounded-md text-sm transition-colors hover:text-foreground">
          <Icon
            className={cn('size-3', invertOnDarkTheme && 'dark:invert')}
            color={IconHex}
          />
          {link.name}
        </div>
      </Link>
    )
  })
}
