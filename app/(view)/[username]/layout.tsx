import ProfileAvatar from '@/components/profile-avatar'
import { Button } from '@/components/ui/button'
import { createQueryClient } from '@/lib/query-client'
import { profileByUsernameQueryOptions } from '@/lib/query-options'
import { queryKeys } from '@/lib/query-keys'
import { getShortenedCount } from '@/lib/count-shortener'
import { Profile } from '@/lib/model/user'
import { getSiteUrl } from '@/lib/site-url'
import OrderStoreProvider from '@/providers/order'
import ProfileStoreProvider from '@/providers/profile-store'
import { fetchApi } from '@/utils/api/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { CctvIcon } from 'lucide-react'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'
import Link from 'next/link'
import ProfileControls from './components/profile-controls'
import ProfileCountStats from './components/profile-count-stats'
import ProfileDescription from './components/profile-description'
import ProfileDialogs from './components/profile-dialogs'
import ProfileLinks from './components/profile-links'
import { FollowButton } from './follow-button'
import ProfileTab from './profile-tab'
import ShowMoreProfileButton from './show-more-profile-button'

const isNotFoundError = (error: unknown) =>
  error instanceof Error && /\b404\b/.test(error.message)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const queryClient = createQueryClient()

  try {
    const profile = await queryClient.fetchQuery(
      profileByUsernameQueryOptions(fetchApi, username, 'lg'),
    )

    return {
      title: `${profile.displayName} - pickle`,
      description: `${profile.displayName} on pickle.pw with the content they want to share`,
      alternates: {
        canonical: `/${profile.username}`,
      },
      openGraph: {
        type: 'profile',
        title: `${profile.displayName} - pickle`,
        url: `${getSiteUrl()}/${profile.username}`,
        description: `${profile.displayName} on pickle.pw with the content they want to share`,
        siteName: 'pickle',
        images: [{ url: profile.avatarUrl }],
      },
      twitter: {
        card: 'summary',
        title: `${profile.displayName} - pickle`,
        description: `${profile.displayName} on pickle.pw with the content they want to share`,
        images: [profile.avatarUrl],
      },
    }
  } catch (error) {
    if (isNotFoundError(error)) {
      return {
        title: '404 - pickle',
        description: 'The profile you are looking for does not exist.',
      }
    }

    console.error('Failed to generate profile metadata:', error)
    return {
      title: 'pickle',
      description: 'The pickle website',
    }
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
  const t = await getTranslations('profile')
  const { username } = await params
  const queryClient = createQueryClient()

  let profile: Profile
  try {
    profile = await queryClient.fetchQuery(
      profileByUsernameQueryOptions(fetchApi, username, 'lg'),
    )
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound()
    }
    throw error
  }

  const tabs = [
    {
      path: '#',
      label: t('tabs.overview'),
      icon: 'home',
      disabled: true,
    },
    {
      path: '/notes',
      label: t('tabs.content'),
      icon: 'content',
    },
    {
      path: '/suggestions',
      label: t('tabs.suggestions'),
      icon: 'suggestions',
    },
    {
      path: '/collections',
      label: t('tabs.collections'),
      icon: 'collections',
      disabled: true,
    },
    {
      path: '/auctions',
      label: t('tabs.auctions'),
      icon: 'auctions',
      disabled: true,
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.displayName,
      alternateName: profile.username,
      url: `${getSiteUrl()}/${profile.username}`,
      image: profile.avatarUrl,
      description: profile.description,
    },
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileStoreProvider profile={profile}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
                        {t('followersLabel')}
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
                        {t('howPeopleSeeProfile')}
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
            <ProfileDialogs />
          </OrderStoreProvider>
        </div>
      </ProfileStoreProvider>
    </HydrationBoundary>
  )
}
