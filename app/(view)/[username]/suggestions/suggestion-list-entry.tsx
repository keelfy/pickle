import { Button } from '@/components/ui/button'
import { OrderDecision, OrderWithDecision } from '@/lib/model/order'
import { cn } from '@/lib/utils'
import { ModalType } from '@/stores/modal'
import {
  ArrowRightIcon,
  CheckIcon,
  CornerDownRightIcon,
  XIcon,
} from 'lucide-react'
import OrderCardBody from './order-card-body'
import { useProfileStore } from '@/providers/profile-store'
import { useMediaQuery } from '@/lib/use-media-query'
import { useModalStore } from '@/providers/modal'
import { RejectOrderDialogParams } from '@/components/view/dialog/reject-order/reject-order-dialog'
import { GameNoteDialogParams } from '@/components/view/dialog/game-note/game-note-dialog'
import { MovieNoteDialogParams } from '@/components/view/dialog/movie-note/movie-note-dialog'
import { localizeContentCategory } from '@/lib/localize-types'

type Props = {
  order: OrderWithDecision
}

type OrderDecisionSectionProps = {
  order: OrderWithDecision
  profileDisplayName?: string
  variant: 'desktop' | 'mobile'
  onOpenRelatedContentNote: () => void
}

function OrderDecisionSection({
  order,
  profileDisplayName,
  variant,
  onOpenRelatedContentNote,
}: OrderDecisionSectionProps) {
  const decision = order.decision
  if (!decision) return null

  const isDesktop = variant === 'desktop'
  const isRejected = decision.status === 'rejected'
  const isApproved = decision.status === 'approved'
  const statusText = isApproved
    ? decision.contentNote?.content?.title ??
      localizeContentCategory(
        decision.contentNote?.content?.category ?? order.category,
        false,
      ).toLowerCase()
    : profileDisplayName

  return (
    <div className={cn(isDesktop ? 'flex w-full items-center gap-2 pl-4' : 'block w-full lg:hidden')}>
      {isDesktop && <CornerDownRightIcon className="size-5" />}
      <Button
        variant="outline"
        className={cn(
          'h-full w-full rounded-t-none bg-primary-foreground hover:bg-primary-foreground/80',
          isDesktop && 'justify-start border-t-0',
          isDesktop && isRejected && 'pointer-events-none',
        )}
        onClick={onOpenRelatedContentNote}
      >
        <div className="flex items-center justify-start gap-1">
          <div
            className={cn(
              'h-2 w-2 animate-pulse rounded-full',
              isApproved ? 'bg-green-500' : 'bg-red-500',
            )}
          />
          {isApproved ? (
            <p className="whitespace-break-spaces">
              <span className="font-bold">Accepted</span>
              <span>&nbsp;as&nbsp;</span>
              <span className="font-semibold">{statusText}</span>
            </p>
          ) : (
            <p className="whitespace-break-spaces">
              <span className="font-bold">Rejected</span>
              <span>&nbsp;by&nbsp;</span>
              <span className="font-semibold">{statusText}</span>
              {!isDesktop && <span className="text-xs">&nbsp;😔</span>}
            </p>
          )}
          {isApproved && <ArrowRightIcon className="h-4 w-4" />}
        </div>
      </Button>
    </div>
  )
}

export default function SuggestionListEntry({ order }: Props) {
  const { openModal } = useModalStore((state) => state)
  const { profile } = useProfileStore((state) => state)
  const isAuthorized = profile?.context?.isAuthorized ?? false
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const handleOpenRelatedContentNote = (decision: OrderDecision) => {
    if (decision.contentNote) {
      const params: GameNoteDialogParams | MovieNoteDialogParams = {
        noteId: decision.contentNote.id,
      }
      let modalType: ModalType
      switch (decision.contentNote.content?.category) {
        case 'games':
          modalType = ModalType.GameNote
          break
        case 'movies':
          modalType = ModalType.MovieNote
          break
        default:
          return
      }
      openModal(modalType, params)
    }
  }

  return (
    <div
      key={order.id}
      className="flex flex-col items-center lg:flex-col lg:items-stretch"
    >
      <div className="flex w-full flex-col lg:w-auto lg:flex-row">
        <OrderCardBody
          order={order}
          className={cn(
            isAuthorized && 'rounded-b-none border-b-0 lg:rounded-md lg:border',
            isAuthorized &&
              !order.decision &&
              'lg:rounded-r-none lg:border-r-0',
            isAuthorized && order.decision && 'lg:rounded-br-none',
          )}
        />
        {isAuthorized && !order.decision && (
          <div className="flex w-full flex-row lg:w-auto lg:flex-col">
            <Button
              variant="outline"
              className="h-full w-full rounded-none rounded-bl-md border-r-0 bg-primary-foreground hover:bg-primary-foreground/80 lg:w-auto lg:rounded-none lg:rounded-tr-md lg:border lg:border-b-0"
              onClick={() => {
                openModal(ModalType.ApproveOrder, { id: order.id })
              }}
            >
              <CheckIcon className="h-4 w-4 text-green-500" /> Accept
            </Button>
            <Button
              variant="outline"
              className="h-full w-full rounded-none rounded-br-md bg-primary-foreground hover:bg-primary-foreground/80 lg:w-auto lg:rounded-br-md"
              onClick={() => {
                const params: RejectOrderDialogParams = {
                  id: order.id,
                  message: order.message,
                  odn: order.orderer?.displayName ?? 'Unknown',
                }
                openModal(ModalType.RejectOrder, params)
              }}
            >
              <XIcon className="h-4 w-4 text-red-500" /> Reject
            </Button>
          </div>
        )}
      </div>
      {order.decision && (
        <OrderDecisionSection
          order={order}
          profileDisplayName={profile?.displayName}
          variant={isDesktop ? 'desktop' : 'mobile'}
          onOpenRelatedContentNote={() =>
            handleOpenRelatedContentNote(order.decision!)
          }
        />
      )}
    </div>
  )
}
