import ContentCategoryIcon from '@/components/ui/content-category-icon'
import ContentNoteRequesterAvatar from '@/components/ui/content-note/content-note-requester-avatar'
import OrdererPopover from '@/components/ui/content-note/orderer-popover'
import { PopoverTrigger } from '@/components/ui/popover'
import { getTimeAgoText, localizeOrderSource } from '@/lib/localize-types'
import { OrderWithDecision } from '@/lib/model/order'
import { cn } from '@/lib/utils'

type Props = {
  order: OrderWithDecision
  className?: string
}

export default function OrderCardBody({ order, className }: Props) {
  return (
    <div
      className={cn(
        'flex w-full flex-1 items-start justify-between gap-4 rounded-md border bg-primary-foreground p-4 text-secondary-foreground shadow-sm',
        order.decision?.status == 'approved' &&
          'lg:border-l-2 lg:border-l-green-800',
        order.decision?.status == 'rejected' &&
          'lg:border-l-2 lg:border-l-red-800',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <ContentCategoryIcon
            category={order.category}
            className="size-6 flex-shrink-0"
          />
          <h2 className="text-md font-bold">{order.message}</h2>
        </div>
        <OrdererPopover
          key={order.id}
          orderer={order.orderer}
          modal={false}
          side="top"
        >
          <div className="flex flex-nowrap items-center gap-0 text-sm text-muted-foreground">
            <p>by&nbsp;</p>
            <PopoverTrigger>
              <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold transition-colors hover:bg-muted hover:text-foreground">
                <ContentNoteRequesterAvatar orderer={order.orderer} />
                <p>{order.orderer?.displayName ?? 'Unknown'}</p>
              </div>
            </PopoverTrigger>
          </div>
        </OrdererPopover>
      </div>
      <div className="grid justify-end gap-2 text-end text-sm text-muted-foreground">
        <p>{getTimeAgoText(new Date(order.createdAt))} ago</p>
        <p>
          via&nbsp;
          <span className="font-bold">{localizeOrderSource(order.source)}</span>
        </p>
      </div>
    </div>
  )
}
