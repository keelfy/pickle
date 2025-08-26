'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  createContentNoteReaction,
  deleteContentNoteReaction,
} from '@/hooks/api-endpoints-client'
import useRedirectToLogin from '@/hooks/use-redirect-to-login'
import { toastError } from '@/lib/toasts'
import { ContentCategory } from '@/lib/model/content'
import { ContentNote } from '@/lib/model/content-note'
import { ContentNoteReaction } from '@/lib/model/note-reaction'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/providers/auth-store'
import { useProfileStore } from '@/providers/profile-store'
import { isSessionActive } from '@/utils/session'
import { EmojiPicker } from '@ferrucc-io/emoji-picker'
import React from 'react'

type Props = {
  contentNote: ContentNote
  category: ContentCategory
  defaultReactions: ContentNoteReaction[]
  className?: string
}

const randomReactions = [
  '🔥',
  '🤮',
  '❤️',
  '👍',
  '👎',
  '🤔',
  '💩',
  '🤡',
  '👏',
  '😁',
  '☠️',
  '🙁',
  '👐',
  '❤️‍🔥',
  '💔',
  '💀',
  '💥',
  '💦',
  '💨',
  '💤',
  '💫',
  '💬',
  '💭',
  '💡',
  '💢',
  '💣',
  '💤',
  '💫',
  '💬',
  '💭',
  '💡',
  '💢',
  '💣',
  '💤',
  '💫',
  '💬',
  '💭',
  '💡',
  '💢',
  '💣',
]

export default function ContentNoteReactions({
  contentNote,
  category,
  defaultReactions,
  className,
}: Props) {
  const session = useAuthStore((state) => state.session)
  const profile = useProfileStore((state) => state.profile)

  const redirectToLogin = useRedirectToLogin()

  const [reactions, setReactions] =
    React.useState<ContentNoteReaction[]>(defaultReactions)
  const [isReactionsChanging, startReactionsChange] = React.useTransition()

  const canReact = () => {
    if (reactions.filter((reaction) => reaction.userReacted).length >= 3) {
      return false
    }

    return true
  }

  const handleEmojiClick = (emoteId: string) => {
    if (!isSessionActive(session) || !profile) {
      redirectToLogin()
      return
    }

    if (isReactionsChanging) return
    const reacted = reactions.find((reaction) => reaction.emoteId === emoteId)
    if (!reacted) return

    if (reacted.userReacted) {
      startReactionsChange(async () => {
        const previousReactions = reactions
        try {
          if (reacted.count > 1) {
            reacted.count--
            reacted.userReacted = false
          } else {
            setReactions((currValue) =>
              currValue.filter((reaction) => reaction.emoteId !== emoteId),
            )
          }
          await deleteContentNoteReaction(
            profile,
            category,
            contentNote.id,
            emoteId,
          )
          setReactions((currValue) =>
            currValue.sort((a, b) => b.count - a.count),
          )
        } catch (error) {
          console.error(error)
          setReactions(previousReactions)
        }
      })
    } else if (canReact()) {
      startReactionsChange(async () => {
        const previousReactions = reactions
        try {
          reacted.userReacted = true
          reacted.count++
          await createContentNoteReaction(
            profile,
            category,
            contentNote.id,
            emoteId,
          )
          setReactions((currValue) =>
            currValue.sort((a, b) => b.count - a.count),
          )
        } catch (error) {
          console.error(error)
          setReactions(previousReactions)
        }
      })
    }
  }

  const handleEmojiSelect = (emoteId: string) => {
    if (!isSessionActive(session) || !profile) {
      redirectToLogin()
      return
    }

    if (isReactionsChanging) return
    if (reactions.find((reaction) => reaction.emoteId === emoteId)) {
      return
    }

    startReactionsChange(async () => {
      try {
        await createContentNoteReaction(
          profile,
          category,
          contentNote.id,
          emoteId,
        )
        const sameEmote = reactions.find(
          (reaction) => reaction.emoteId === emoteId,
        )
        if (sameEmote) {
          sameEmote.count++
        } else {
          setReactions([
            ...reactions,
            {
              emoteId,
              source: 'unicode_emoji',
              count: 1,
              userReacted: true,
            },
          ])
        }
      } catch (error) {
        console.error(error)
        toastError('Error adding reaction', error)
      }
    })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoteId}
          className="h-7 rounded-xl px-2 py-1"
          onClick={() => handleEmojiClick(reaction.emoteId)}
          variant={reaction.userReacted ? 'default' : 'secondary'}
        >
          <div className="flex items-center gap-1">
            <div className="text-sm">{reaction.emoteId}</div>
            <div className="text-md font-semibold">{reaction.count}</div>
          </div>
        </Button>
      ))}
      {isSessionActive(session) && canReact() && (
        <Popover>
          <PopoverTrigger disabled={!canReact()}>
            <div className="flex h-7 items-center justify-center rounded-xl border px-2 py-1">
              {reactions.length === 0 ? (
                <p className="text-sm font-semibold">
                  +&nbsp;
                  {
                    randomReactions[
                      Math.floor(Math.random() * randomReactions.length)
                    ]
                  }
                </p>
              ) : (
                '+'
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-0">
            <EmojiPicker onEmojiSelect={handleEmojiSelect}>
              <EmojiPicker.Header>
                <EmojiPicker.Input placeholder="Search emoji" />
              </EmojiPicker.Header>
              <EmojiPicker.Group>
                <EmojiPicker.List />
              </EmojiPicker.Group>
            </EmojiPicker>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
