import React from 'react'
import Navbar from './navbar'
import NextLink from 'next/link'
import Link from 'next/link'
import { DetailedUser } from '@/lib/model/user'
import AuthStoreProvider from '@/providers/auth-store'
import { fetchApi } from '@/utils/api/server'
import { createQueryClient } from '@/lib/query-client'
import { meQueryOptions } from '@/lib/query-options'
import { getTranslations } from 'next-intl/server'

export default async function RootLayout({ children }: React.PropsWithChildren) {
  const t = await getTranslations('footer')
  const queryClient = createQueryClient()
  let user: DetailedUser | undefined = undefined

  try {
    user = await queryClient.fetchQuery(meQueryOptions(fetchApi, 'md'))
  } catch (error) {
    user = undefined
  }

  return (
    <AuthStoreProvider user={user} session={undefined}>
      <div className="flex flex-col gap-10">
        <div className="container flex min-h-svh max-w-5xl flex-1 flex-col gap-10">
          <Navbar className="pt-4" user={user} />
          <main className="flex-1">{children}</main>
        </div>
        <footer className="flex h-fit items-center justify-center border-t py-6 text-center text-xs">
          <div className="flex flex-col items-center gap-2">
            <p>
              {t('poweredBy')}&nbsp;
              <NextLink
                href="https://pickle.pw/"
                target="_blank"
                className="font-bold decoration-muted-foreground underline-offset-2 hover:underline"
                rel="noreferrer"
              >
                pickle
              </NextLink>
            </p>
            <div>
              <Link
                href="/terms"
                target="_blank"
                className="decoration-muted-foreground underline-offset-2 hover:underline"
              >
                {t('termsOfService')}
              </Link>
              &nbsp;&bull;&nbsp;
              <Link
                href="/privacy"
                target="_blank"
                className="decoration-muted-foreground underline-offset-2 hover:underline"
              >
                {t('privacyPolicy')}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </AuthStoreProvider>
  )
}
