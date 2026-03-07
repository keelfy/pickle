import { useMediaQuery } from '@/lib/use-media-query'
import RatingStar from './rating-star'
import React from 'react'
import { cn } from '@/lib/utils'

type Props = React.ComponentProps<'div'> & {
  value: number | undefined
}

export default function RatingRow({ value, className, ...props }: Props) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return (
    <div className={cn('flex items-center gap-1', className)} {...props}>
      {[...Array(10)].map((_, i) => (
        <RatingStar
          key={i}
          active={value !== undefined && i < value}
          number={i + 1}
          className="transition-all duration-300 hover:scale-110"
          size={isDesktop ? 'md' : 'sm'}
        />
      ))}
    </div>
  )
}
