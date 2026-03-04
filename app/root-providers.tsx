'use client'

import { createQueryClient } from '@/lib/query-client'
import ModalStoreProvider from '@/providers/modal'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import React, { Suspense } from 'react'

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') return createQueryClient()
  if (!browserQueryClient) browserQueryClient = createQueryClient()
  return browserQueryClient
}

export default function RootProviders({ children }: React.PropsWithChildren) {
  const [queryClient] = React.useState(getQueryClient)

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Suspense>
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>
            <ModalStoreProvider>{children}</ModalStoreProvider>
          </NuqsAdapter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Suspense>
    </ThemeProvider>
  )
}
