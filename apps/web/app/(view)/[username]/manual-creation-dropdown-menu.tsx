'use client'

import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import RankOneIcon from '@/components/ui/icons/rankone-icon'
import { cn } from '@/lib/utils'
import { SiLetterboxd, SiSteam } from '@icons-pack/react-simple-icons'
import { FileJsonIcon, MoreHorizontalIcon, TableIcon } from 'lucide-react'

type Props = {
  className?: string
}

export default function ManualCreationDropdownMenu({ className }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className={cn(buttonVariants({ size: 'sm' }), className)}>
          <MoreHorizontalIcon className="size-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mass import from file</DropdownMenuLabel>
        <DropdownMenuItem className="text-muted-foreground">
          <TableIcon className="h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem className="text-muted-foreground">
          <FileJsonIcon className="h-4 w-4" />
          JSON (.json)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Mass import from website</DropdownMenuLabel>
        <DropdownMenuItem className="text-muted-foreground">
          <SiLetterboxd className="h-4 w-4" />
          Letterboxd
        </DropdownMenuItem>
        <DropdownMenuItem className="text-muted-foreground">
          <RankOneIcon className="h-4 w-4" />
          RankOne
        </DropdownMenuItem>
        <DropdownMenuItem className="text-muted-foreground">
          <SiSteam className="h-4 w-4" />
          Steam
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
