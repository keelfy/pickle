import ProfileAvatar from '@/components/profile-avatar'
import { Button } from '@/components/ui/button'
import DeleteContentAlertDialog from '@/components/view/dialog/delete-content-alert/delete-content-alert-dialog'
import GameNoteCreatorDialog from '@/components/view/dialog/game-note-creator/game-note-creator-dialog'
import GameNoteEditorDialog from '@/components/view/dialog/game-note-editor/game-note-editor-dialog'
import GameNoteDialog from '@/components/view/dialog/game-note/game-note-dialog'
import ManualNoteCreationDialog from '@/components/view/dialog/manual-note-creation/manual-note-creation-dialog'
import MovieNoteCreatorDialog from '@/components/view/dialog/movie-note-creator/movie-note-creator-dialog'
import MovieNoteEditorDialog from '@/components/view/dialog/movie-note-editor/movie-note-editor-dialog'
import MovieNoteDialog from '@/components/view/dialog/movie-note/movie-note-dialog'
import SelectContentItemDialog from '@/components/view/dialog/select-content-item/select-content-item-dialog'
import ShowMoreProfileDialog from '@/components/view/dialog/show-more-profile/show-more-profile-dialog'
import { fetchProfileByUsername } from '@/hooks/api-endpoints-server'
import { getShortenedCount } from '@/lib/count-shortener'
import { Profile } from '@/lib/model/user'
import OrderStoreProvider from '@/providers/order'
import ProfileStoreProvider from '@/providers/profile-store'
import { CctvIcon } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import ApproveOrderDialog from '../../../components/view/dialog/approve-order/approve-order-dialog'
import CreateOrderDialog from '../../../components/view/dialog/create-order/create-order-dialog'
import ProfileSearchDialog from '../../../components/view/dialog/profile-search/profile-search-dialog'
import DenyOrderDialog from '../../../components/view/dialog/reject-order/reject-order-dialog'
import ProfileControls from './components/profile-controls'
import ProfileCountStats from './components/profile-count-stats'
import ProfileDescription from './components/profile-description'
import ProfileLinks from './components/profile-links'
import { FollowButton } from './follow-button'
import ProfileTab from './profile-tab'
import ShowMoreProfileButton from './show-more-profile-button'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  const profile = await fetchProfileByUsername(username, 'lg').catch(
    (error) => error.message,
  )

  if (!profile || typeof profile === 'string') {
    return {
      title: '404 - pickle',
      description: 'The profile you are looking for does not exist.',
    }
  }

  return {
    title: `${profile.displayName} - pickle`,
    description: `${profile.displayName} on pickle.pw with the content they want to share`,
    openGraph: {
      type: 'profile',
      title: `${profile.displayName} - pickle`,
      url: `https://pickle.pw/${profile.link}`,
      description: `${profile.displayName} on pickle.pw with the content they want to share`,
      siteName: 'pickle',
      images: [{ url: profile.avatarUrl }],
    },
  }
}

export type Props = {
  params: Promise<{
    username: string
  }>
}

export default async function RootLayout({
  children,
  params,
}: React.PropsWithChildren<Props>) {
  const { username } = await params

  let profile: Profile | undefined = undefined
  let profileError: string | undefined = undefined
  try {
    profile = await fetchProfileByUsername(username, 'lg')
  } catch (error) {
    profileError = error instanceof Error ? error.message : 'Unknown error'
  }

  if (!profile || profileError) {
    return (
      <div className="flex h-svh w-full items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-medium">
            The profile you are looking for does not exist.
          </p>
          <p className="text-destructive">{profileError}</p>
        </div>
      </div>
    )
  }

  const tabs = [
    {
      path: '#',
      label: 'Overview',
      icon: 'home',
      disabled: true,
    },
    {
      path: '/notes',
      label: 'Content',
      icon: 'content',
    },
    {
      path: '/suggestions',
      label: 'Suggestions',
      icon: 'suggestions',
    },
    {
      path: '/collections',
      label: 'Collections',
      icon: 'collections',
      disabled: true,
    },
    {
      path: '/auctions',
      label: 'Auctions',
      icon: 'auctions',
      disabled: true,
    },
  ]

  return (
    <ProfileStoreProvider profile={profile}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center lg:justify-between">
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-6">
              <ProfileAvatar
                avatarUrl={profile.avatarUrl}
                size="lg"
                className="h-24 w-24 lg:h-40 lg:w-40"
              />
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="line-clamp-1 text-3xl font-bold">
                    {profile.displayName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link
                      href={`/${profile.username}`}
                      className="hidden font-semibold transition-colors duration-300 hover:text-primary lg:block"
                    >
                      @{profile.username}
                    </Link>
                    <p className="hidden lg:block">&bull;</p>
                    <p>
                      {getShortenedCount(profile.counts?.followers ?? 0)}{' '}
                      follower(-s)
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 lg:items-start lg:justify-start">
                  <ProfileDescription description={profile.description} />
                  <div className="flex items-center gap-4">
                    <ProfileLinks links={profile.socialLinks} />
                    <ShowMoreProfileButton />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 lg:justify-start">
                  <FollowButton className="lg:w-min" />
                  {profile.context?.isAuthorized && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="group hidden flex-nowrap items-center gap-2 lg:flex"
                    >
                      <CctvIcon className="size-4" />
                      {/* <p className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100"> */}
                      How people see my profile?
                      {/* </p> */}
                    </Button>
                  )}
                  <ProfileControls profile={profile} className="lg:hidden" />
                </div>
              </div>
            </div>
            <div className="hidden flex-col items-center justify-center gap-2 lg:flex">
              <ProfileCountStats counts={profile.counts} />
              <ProfileControls profile={profile} />
            </div>
          </div>
        </div>

        <div className="flex w-full justify-center gap-2 border-b border-muted-foreground text-sm lg:justify-start">
          {tabs.map((tab) => (
            <ProfileTab
              key={tab.path}
              path={`/${username}${tab.path}`}
              label={tab.label}
              icon={tab.icon}
              disabled={tab.disabled}
              tabType="page"
            />
          ))}
          <ProfileTab path="" label="" icon="" tabType="search-modal" />
        </div>

        <OrderStoreProvider>
          <div className="w-full">{children}</div>
          <DenyOrderDialog />
          <ApproveOrderDialog />

          <ProfileSearchDialog />
          <ShowMoreProfileDialog />
          <CreateOrderDialog />
          <DeleteContentAlertDialog />

          <GameNoteDialog />
          <MovieNoteDialog />

          <ManualNoteCreationDialog />
          <GameNoteEditorDialog />
          <MovieNoteEditorDialog />
          <GameNoteCreatorDialog />
          <MovieNoteCreatorDialog />
          <SelectContentItemDialog />
        </OrderStoreProvider>
      </div>
    </ProfileStoreProvider>
  )
}
