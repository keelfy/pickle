import { Orderer } from '@/lib/model/orderer'
import ContentNoteRequesterAvatar from './content-note-requester-avatar'
import OrdererPopover from './orderer-popover'
import { PopoverTrigger } from '../popover'

type Props = {
  orderer?: Orderer
  ordererCount?: number
}

export default function ContentNoteRequester({
  orderer,
  ordererCount = 0,
}: Props) {
  return (
    <OrdererPopover orderer={orderer}>
      <div className="flex items-center text-xs">
        <PopoverTrigger>
          <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground">
            <ContentNoteRequesterAvatar orderer={orderer} />
            <p>{orderer?.displayName ?? 'Unknown'}</p>
          </div>
        </PopoverTrigger>
        {ordererCount > 1 && (
          <p className="text-muted-foreground">
            + <span className="font-semibold">{ordererCount - 1}</span>
            <span className="hidden sm:inline">&nbsp;more</span>
          </p>
        )}
      </div>
    </OrdererPopover>
  )
}
