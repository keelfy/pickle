import { Button } from '@/components/ui/button'
import { Profile } from '@/lib/model/user'
import { PlusIcon, SparklesIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import ManualNoteCreationButton from '../manual-note-creation-button'
import SuggestionLinkCopyButton from '../suggestion-link-copy-button'

type Props = React.ComponentProps<'div'> & {
  profile: Profile
}

export default function ProfileControls({ profile, ...props }: Props) {
  return (
    <div {...props}>
      {profile?.suggestionPreferences?.enabled &&
        !profile.context?.isAuthorized && (
          <div className="flex items-center lg:min-w-52">
            <Button size="sm" className="w-full flex-1 rounded-r-none" asChild>
              <Link
                href={`/suggest/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <SparklesIcon className="size-4" />
                Suggest Content
              </Link>
            </Button>

            <SuggestionLinkCopyButton
              className="rounded-l-none border-l-0"
              size="sm"
            />
          </div>
        )}
      {profile.context?.isAuthorized && (
        <div className="flex items-center lg:min-w-52">
          <ManualNoteCreationButton size="sm" className="flex-1">
            <PlusIcon className="size-4" />
            Add Content
          </ManualNoteCreationButton>
          {/* <ManualCreationDropdownMenu className="rounded-l-none" /> */}
        </div>
      )}
    </div>
  )
}
