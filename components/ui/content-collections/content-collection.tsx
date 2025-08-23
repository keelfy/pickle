'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useProfileStore } from '@/providers/profile-store'
import React from 'react'
import AddCollectionElement from './add-collection-element'
import CollectionElement from './collection-element'
import CollectionHeaderLine from './collection-header'
import CollectionHeaderControls from './collection-header-controls'
import CollectionHeaderTitleButton from './collection-header-title-button'
import LoadMoreCollectionElement from './load-more-collection-element'
import { Collection, CollectionItem } from '@/lib/model/collection'

type Props = {
  collection: Collection
  items: CollectionItem[]
  hasMoreItems: boolean
}

export default function ContentCollection({
  collection,
  items,
  hasMoreItems,
}: Props) {
  const [collapsed, setCollapsed] = React.useState(false)
  const toggleCollapsed = () => setCollapsed(!collapsed)
  const { profile } = useProfileStore((state) => state)

  return (
    <Collapsible open={!collapsed}>
      <CollectionHeaderLine
        leftSide={
          <div className="flex items-center gap-1">
            <CollectionHeaderTitleButton
              name={collection.name}
              onClick={toggleCollapsed}
            />
            <span className="text-sm text-muted-foreground">
              ({items.length})
            </span>
          </div>
        }
        rightSide={
          <CollectionHeaderControls
            toggleCollapsed={toggleCollapsed}
            collapsed={collapsed}
            collection={collection}
          />
        }
      />
      <CollapsibleContent>
        <ScrollArea className="w-full max-w-[848px] whitespace-nowrap">
          <div className="flex items-start gap-2 pb-3 pl-1 pt-1">
            {profile?.context?.isAuthorized && (
              <AddCollectionElement
                collection={collection}
                className="flex-shrink-0"
              />
            )}
            {items.map((item) => (
              <CollectionElement
                key={item.id}
                item={item}
                className="flex-shrink-0"
              />
            ))}
            {hasMoreItems && (
              <LoadMoreCollectionElement
                collectionId={collection.id}
                className="flex-shrink-0"
              />
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  )
}
