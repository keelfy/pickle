import { cn } from '@/lib/utils'

type Props = React.ComponentProps<'div'> & {
  rate: number | undefined
}

const getRatingColor = (rate: number | undefined) => {
  if (!rate) return 'text-gray-500'
  if (rate >= 7) return 'text-green-500'
  if (rate >= 3) return 'text-yellow-500'
  return 'text-red-500'
}

export default function ContentNoteCardRating({
  rate,
  className,
  ...props
}: Props) {
  const ratingColor = getRatingColor(rate)
  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center rounded-lg bg-secondary px-4 py-2 lg:px-8 lg:py-5',
        className,
      )}
      {...props}
    >
      <div className="text-lg font-bold text-muted-foreground lg:text-3xl">
        {rate ? (
          <p>
            <span className={ratingColor}>{rate}</span>
            /10
          </p>
        ) : (
          'N/A'
        )}
      </div>
      <div className="whitespace-nowrap text-xs font-semibold lg:text-lg">
        rating
      </div>
    </div>
  )
}
