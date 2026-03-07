import { Orderer } from '@/lib/model/orderer'
import { Avatar, AvatarFallback, AvatarImage } from '../avatar'
import { getOrdererAvatarIcon } from '@/lib/profile-link-icon'
import { cn } from '@/lib/utils'
import { QuestionMarkIcon } from '@radix-ui/react-icons'

type Props = {
  orderer?: Orderer
  className?: string
}

export default function ContentNoteRequesterAvatar({
  orderer,
  className,
}: Props) {
  if (!orderer) {
    return <QuestionMarkIcon className={cn('size-3', className)} />
  }

  if (orderer.avatarUrl.length > 0) {
    return (
      <Avatar className={cn('size-4', className)}>
        <AvatarImage src={orderer.avatarUrl} />
        <AvatarFallback>{orderer?.displayName?.charAt(0)}</AvatarFallback>
      </Avatar>
    )
  }

  const { Icon, IconHex, invertOnDarkTheme } = getOrdererAvatarIcon(
    orderer.source,
  )
  return (
    <Icon
      className={cn('size-3', invertOnDarkTheme && 'dark:invert', className)}
      color={IconHex}
    />
  )
}
