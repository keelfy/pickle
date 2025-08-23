'use client'

import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import React from 'react'

export default function MenuItemUnderline({
  href,
  children,
}: React.PropsWithChildren<{
  href: string
}>) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'relative before:absolute before:bottom-1 before:left-[50%] before:h-[2px] before:w-[0%] before:origin-center before:bg-muted-foreground/100 before:opacity-0 before:transition-all after:absolute after:bottom-1 after:right-[50%] after:h-[2px] after:w-[0%] after:origin-center after:bg-muted-foreground/100 after:opacity-0 after:transition-all',
        pathname === href &&
          'before:w-[40%] before:opacity-100 after:w-[40%] after:opacity-100',
      )}
    >
      {children}
    </div>
  )
}
