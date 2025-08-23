'use client'

import { Badge } from '@/components/ui/badge'
import { CommandItem } from '@/components/ui/command'
import { useModalStore } from '@/providers/modal'
import { contentCategoryLabels } from '@/utils/api/constants'
import { Content } from '@/lib/model/content'

type Props = {
  source: Content
  username: string
}

export default function ContentSearchItem({ source, username }: Props) {
  const { closeModal } = useModalStore((state) => state)

  return (
    <CommandItem asChild className="cursor-pointer">
      <div className="flex w-full items-center justify-between">
        <div className="text-md">{source.title}</div>
        <Badge>
          {
            contentCategoryLabels.find((cat) => cat.value === source.category)
              ?.label
          }
        </Badge>
      </div>
    </CommandItem>
  )
}
