import { AvatarProps } from '@radix-ui/react-avatar'
import { UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ImageSize } from '@/lib/model/types'

type Props = AvatarProps & {
  avatarUrl: string | undefined
  size?: ImageSize
}

const avatarSizes = {
  sm: 32,
  md: 64,
  lg: 128,
}

const avatarIconSizes = {
  sm: 4,
  md: 6,
  lg: 10,
}

export default function ProfileAvatar({
  avatarUrl,
  size = 'lg',
  className,
}: Props) {
  return (
    <Avatar className={className}>
      <AvatarImage
        src={avatarUrl}
        alt="Profile Avatar"
        width={avatarSizes[size]}
        height={avatarSizes[size]}
      />
      <AvatarFallback>
        <UserIcon className={`size-${avatarIconSizes[size]}`} />
      </AvatarFallback>
    </Avatar>
  )
}
