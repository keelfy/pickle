import RatingRow from '@/app/(view)/[username]/components/rating-row'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { HeartIcon } from 'lucide-react'

type Props = {
  rating?: number
  className?: string
}

export default function ContentNoteDialogRated({ rating, className }: Props) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <HeartIcon className="h-4 w-4" />
        <Label className="text-md font-semibold">Rated</Label>
      </div>
      <RatingRow value={rating} className="self-center" />
    </div>
  )
}
