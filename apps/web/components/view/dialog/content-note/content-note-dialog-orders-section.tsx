'use client'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import ContentNoteRequesterAvatar from '@/components/ui/content-note/content-note-requester-avatar'
import OrdererPopover from '@/components/ui/content-note/orderer-popover'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useContentNoteOrders } from '@/hooks/queries/use-content-note-orders'
import { getTimeAgoText } from '@/lib/localize-types'
import { ContentCategory } from '@/lib/model/content'
import { DetailedContentNote } from '@/lib/model/content-note'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/providers/profile-store'
import { ChevronLeftIcon, UserPlusIcon } from 'lucide-react'
import React from 'react'

type Props = {
  contentNote?: DetailedContentNote
  category: ContentCategory
  className?: string
}

export const ContentNoteDialogOrdersSection = ({
  contentNote,
  category,
  className,
}: Props) => {
  const { profile } = useProfileStore((state) => state)
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [ordersPage, setOrdersPage] = React.useState(0)
  const { data: orders, isPending: areOrdersLoading } = useContentNoteOrders({
    user: profile ?? undefined,
    category,
    noteId: contentNote?.id,
    page: ordersPage,
    size: 5,
    enabled: detailsOpen,
  })

  React.useEffect(() => {
    setDetailsOpen(false)
    setOrdersPage(0)
  }, [contentNote?.id])

  return (
    <Collapsible
      open={detailsOpen}
      onOpenChange={() => setDetailsOpen(!detailsOpen)}
      className={cn('space-y-2', className)}
    >
      <div className="flex items-center justify-between space-x-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="link"
            size="sm"
            className="text-md p-0 font-semibold"
          >
            <UserPlusIcon className="size-4" />
            <p>
              Suggesters
              <span className="text-muted-foreground">
                &nbsp;({contentNote?.ordererCount ?? 0})
              </span>
            </p>
          </Button>
        </CollapsibleTrigger>
        {areOrdersLoading && <LoadingSpinner />}
        <Separator orientation="horizontal" className="flex-1" />
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <ChevronLeftIcon
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                detailsOpen && '-rotate-90',
              )}
            />
            <span className="sr-only">Toggle suggesters view</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 pb-2">
          <TooltipProvider>
            {orders && orders.content.length === 0 && ordersPage === 0 && (
              <p className="w-full text-center text-muted-foreground">
                No suggesters found.
              </p>
            )}
            {orders && orders.content.length > 0 && (
              <div className="grid gap-2">
                {orders.content.map((order) => {
                  return (
                    <OrdererPopover
                      key={order.id}
                      orderer={order.orderer}
                      modal={false}
                      side="top"
                    >
                      <PopoverTrigger>
                        <div className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground">
                          <div className="flex items-center gap-2">
                            <ContentNoteRequesterAvatar
                              orderer={order.orderer}
                              className="size-4"
                            />
                            <p>{order.orderer?.displayName ?? 'Unknown'}</p>
                          </div>
                          <p>{getTimeAgoText(new Date(order.createdAt))} ago</p>
                        </div>
                      </PopoverTrigger>
                    </OrdererPopover>
                  )
                })}
              </div>
            )}
          </TooltipProvider>
          {orders && orders.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={ordersPage <= 0}
                    tabIndex={ordersPage <= 0 ? -1 : undefined}
                    size="sm"
                    className={
                      ordersPage <= 0
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                    onClick={() => setOrdersPage(ordersPage - 1)}
                  />
                </PaginationItem>
                <PaginationItem className={ordersPage === 0 ? 'invisible' : ''}>
                  <PaginationLink
                    href="#"
                    size="sm"
                    onClick={() => setOrdersPage(ordersPage - 1)}
                  >
                    {ordersPage}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" size="sm" isActive>
                    {ordersPage + 1}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem
                  className={
                    ordersPage >= orders.totalPages - 1 ? 'invisible' : ''
                  }
                >
                  <PaginationLink
                    href="#"
                    size="sm"
                    onClick={() => setOrdersPage(ordersPage + 1)}
                  >
                    {ordersPage + 2}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    tabIndex={ordersPage >= orders.totalPages - 1 ? -1 : undefined}
                    size="sm"
                    className={
                      ordersPage >= orders.totalPages - 1
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                    onClick={() => setOrdersPage(ordersPage + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
