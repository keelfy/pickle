'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EllipsisIcon } from 'lucide-react'
import { useCollectionContext } from './collections-context'

type Props = {
  collectionId: string
  className?: string
}

export default function LoadMoreCollectionElement({
  collectionId,
  className,
}: Props) {
  const { loadMoreItems } = useCollectionContext()

  return (
    <Button
      variant="outline"
      className={cn(
        'flex flex-col items-center justify-center rounded-md p-0',
        className,
      )}
      style={{ width: `100px`, height: `150px` }}
      onClick={() => loadMoreItems(collectionId)}
    >
      <EllipsisIcon />
      <p className="text-sm text-muted-foreground">Load more</p>
    </Button>
  )
}
