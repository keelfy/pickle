import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { localizeContentCategory } from '@/lib/localize-types'
import {
  ContentCategory,
  VISIBLE_CONTENT_CATEGORIES,
} from '@/lib/model/content'
import { cn } from '@/lib/utils'
import { TwitchChannelReward } from '@/utils/api/types'
import { LinkIcon, UnlinkIcon } from 'lucide-react'
import React from 'react'

type Props = {
  className?: string
  reward: TwitchChannelReward
  isPending: boolean
  handleClick: (
    reward: TwitchChannelReward,
    category: ContentCategory | undefined,
  ) => void
  isTracked: boolean
  handleChangeCategory?: (
    reward: TwitchChannelReward,
    category: ContentCategory | undefined,
  ) => void
}

export default function ChannelRewardItem({
  className,
  reward,
  isPending,
  handleClick,
  isTracked,
  handleChangeCategory = () => {},
}: Props) {
  const [selectedCategory, setSelectedCategory] = React.useState<
    ContentCategory | undefined
  >(reward.category)

  const buttonVariant = isTracked ? 'destructive' : 'secondary'

  const ButtonIcon = isTracked ? UnlinkIcon : LinkIcon

  const onSelectCategory = (value: string) =>
    setSelectedCategory(
      value === 'any' ? undefined : (value as ContentCategory),
    )

  React.useEffect(() => {
    handleChangeCategory(reward, selectedCategory)
  }, [selectedCategory])

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md rounded-r-none border border-r-0 bg-primary-foreground px-2 py-1">
        <p style={{ color: reward.backgroundColor }} className="text-sm">
          {reward.title}
        </p>
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm text-muted-foreground">
            {reward.cost}
          </p>
        </div>
      </div>
      <Select
        value={selectedCategory}
        onValueChange={onSelectCategory}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn('flex-0 h-full w-1/2 rounded-none')}
          disabled={isPending}
        >
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any</SelectItem>
          {VISIBLE_CONTENT_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {localizeContentCategory(category, true)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant={buttonVariant}
        size="icon"
        disabled={isPending}
        className="h-full min-h-10 flex-shrink-0 rounded-l-none"
        onClick={() => handleClick(reward, selectedCategory)}
      >
        {isPending ? <LoadingSpinner /> : <ButtonIcon className="h-4 w-4" />}
      </Button>
    </div>
  )
}
