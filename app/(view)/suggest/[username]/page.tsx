import LanguageDropdownMenu from '@/components/language-dropdown-menu'
import ProfileAvatar from '@/components/profile-avatar'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Card, CardDescription } from '@/components/ui/card'
import { fetchProfileByUsername } from '@/hooks/api-endpoints-server'
import { getShortenedCount } from '@/lib/count-shortener'
import { Metadata } from 'next'
import Link from 'next/link'
import OrderForm from './order-form'
import OrdersDisabledSection from './orders-disabled-section'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  const profile = await fetchProfileByUsername(username, 'lg').catch(
    (error: Error) => error.message,
  )

  if (!profile || typeof profile === 'string') {
    return { title: 'Profile not found - pickle' }
  }

  return {
    title: `Suggest for ${profile.username} - pickle`,
    description: `Suggest content for ${profile.displayName} on pickle.pw`,
    openGraph: {
      type: 'website',
      title: `Suggest for ${profile.username} - pickle`,
      url: `https://pickle.pw/suggest/${profile.username}`,
      description: `Suggest content for ${profile.displayName} on pickle.pw`,
      siteName: 'pickle',
      images: [{ url: profile.avatarUrl }],
    },
  }
}

export type Props = { params: Promise<{ username: string }> }

export default async function SuggestPage({ params }: Props) {
  const { username } = await params

  const profile = await fetchProfileByUsername(username, 'lg').catch(() => {
    return undefined
  })

  if (!profile || typeof profile === 'string') {
    return (
      <div className="flex h-svh w-full items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl font-medium">
            The profile you are looking for does not exist.
          </p>
          <p className="text-destructive">{profile ?? 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-svh w-full">
      <div className="mx-auto flex min-w-max max-w-2xl flex-col gap-4 py-16">
        <Card className="flex min-w-max max-w-2xl items-center gap-4 p-4 shadow-lg">
          <Link href={`/${profile.username}`} target="_blank">
            <ProfileAvatar
              avatarUrl={profile.avatarUrl}
              size="lg"
              className="h-24 w-24 transition-opacity hover:opacity-80"
            />
          </Link>
          <div className="space-y-2">
            <div className="space-y-0">
              <Link
                href={`/${profile.username}`}
                target="_blank"
                className="cursor-pointer text-3xl font-bold"
              >
                {profile?.displayName}
              </Link>
              <div className="flex items-center gap-2 text-sm">
                <div>@{profile.username}</div>
                <div className="text-muted-foreground">&bull;</div>
                <div>
                  {getShortenedCount(profile?.counts?.followers ?? 0)} followers
                </div>
              </div>
            </div>
            <CardDescription>
              You can suggest any game, movie, series, anime or just a video!
            </CardDescription>
          </div>
        </Card>
        <Card className="flex max-w-2xl flex-1 flex-col items-center gap-4 shadow-lg">
          <div className="relative">
            <OrderForm profile={profile} className="max-w-2xl p-6" />
            {!profile.suggestionPreferences?.enabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <OrdersDisabledSection profile={profile} />
              </div>
            )}
          </div>
        </Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="text-xs">
              Powered by{' '}
              <a
                href="https://pickle.gg"
                target="_blank"
                className="font-bold decoration-muted-foreground underline-offset-2 hover:underline"
              >
                pickle
              </a>
            </div>
            <div className="text-[0.7rem] text-muted-foreground">
              Egor Kuzmin&nbsp;&bull;&nbsp;Terazije 4, 11000 Belgrade, Serbia
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageDropdownMenu />
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </div>
  )
}
