'use client'

import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import React from 'react'
import RatingStar from './rating-star'

type Props = React.ComponentProps<'div'> & {
  value: number
  onChange: (value: number | undefined) => void
}

const RatingRowInput = ({ value, onChange, className }: Props) => {
  const [hoveredStar, setHoveredStar] = React.useState<number>(0)

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const handleStarClick = (starIndex: number) => {
    onChange(value === starIndex + 1 ? undefined : starIndex + 1)
  }

  return (
    <div className={cn('flex items-center', className)}>
      {[...Array(10)].map((_, i) => (
        <button
          key={i}
          onClick={() => handleStarClick(i)}
          type="button"
          onMouseEnter={() => setHoveredStar(i + 1)}
          onMouseLeave={() => setHoveredStar(0)}
          className={cn(
            'px-0.5 transition-all duration-300',
            hoveredStar > i && 'scale-110',
          )}
        >
          <RatingStar
            active={i < value || hoveredStar > i}
            number={i + 1}
            pointer
            size={isDesktop ? 'md' : 'sm'}
          />
        </button>
      ))}
    </div>
  )
}

export default RatingRowInput
