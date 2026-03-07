import { cn } from '@/lib/utils'
import { StarIcon } from 'lucide-react'
import React from 'react'

type Props = React.ComponentProps<'div'> & {
  active: boolean
  number: number
  pointer?: boolean
  size?: 'sm' | 'md'
}

export default function RatingStar({
  active,
  number,
  className,
  pointer = false,
  size = 'md',
}: Props) {
  return (
    <div
      className={cn(
        `relative flex items-center justify-center transition-colors`,
        size === 'sm' ? 'size-8' : 'size-[42px]',
        pointer && 'cursor-pointer',
        className,
      )}
    >
      <label
        className={cn(
          `absolute flex translate-y-[1px] items-center justify-center text-xs font-semibold text-primary transition-colors duration-300 dark:text-accent`,
          size === 'sm' ? 'size-3.5' : 'size-4',
          !active && 'dark:text-primary',
          pointer && 'cursor-pointer',
        )}
      >
        {number}
      </label>
      <StarIcon
        fill="currentColor"
        className={cn(
          `text-primary-foreground transition-colors duration-300`,
          size === 'sm' ? 'size-8' : 'size-[42px]',
          active && 'text-yellow-400',
        )}
      />
      {/* <RateStarIcon
        fill="currentColor"
        className={cn(
          `size-[${size}] text-primary-foreground transition-colors duration-300`,
          active && 'text-yellow-400',
        )}
        strokeWidth={0.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        paintOrder="fill stroke"
      /> */}
    </div>
  )
}
