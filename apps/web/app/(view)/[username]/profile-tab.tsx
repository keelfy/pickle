'use client'

import { cn } from '@/lib/utils'
import { useModalStore } from '@/providers/modal'
import { ModalType } from '@/stores/modal'
import {
  BellIcon,
  CatIcon,
  ClapperboardIcon,
  GamepadIcon,
  HomeIcon,
  LibraryIcon,
  ListVideoIcon,
  SearchIcon,
  ShoppingBagIcon,
  TvIcon,
  VideoIcon,
  ZapIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  path: string
  label: string
  icon: string
  tabType: 'page' | 'search-modal'
  disabled?: boolean
}

const icons = {
  home: HomeIcon,
  games: GamepadIcon,
  movies: ClapperboardIcon,
  anime: CatIcon,
  series: TvIcon,
  videos: VideoIcon,
  content: ListVideoIcon,
  auctions: ZapIcon,
  collections: LibraryIcon,
  suggestions: ShoppingBagIcon,
}

export default function ProfileTab({
  path,
  label,
  icon,
  tabType,
  disabled,
}: Props) {
  const pathname = usePathname()
  const { openModal } = useModalStore((state) => state)

  if (tabType === 'search-modal') {
    return (
      <button
        className={cn(
          'flex items-center gap-2 rounded-t-md border-b-2 border-b-transparent px-3 py-2 font-medium transition-all duration-300 hover:bg-muted/50 hover:text-primary',
          disabled && 'pointer-events-none opacity-50',
        )}
        onClick={() => openModal(ModalType.ProfileSearch)}
      >
        <SearchIcon className="size-4" />
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded bg-secondary px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 lg:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    )
  }

  const Icon = icons[icon as keyof typeof icons] ?? HomeIcon

  return (
    <Link
      href={path}
      className={cn(
        'text-md flex items-center gap-2 border-b-2 border-b-transparent px-3 py-2 font-medium transition-all duration-300 hover:border-b-primary hover:text-primary',
        pathname.startsWith(path)
          ? 'border-b-primary'
          : 'text-muted-foreground',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <Icon className="size-4" />
      <span className="hidden lg:block">{label}</span>
    </Link>
  )
}
