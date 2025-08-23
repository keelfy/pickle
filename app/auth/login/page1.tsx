import { getLoginFlow, OryPageParams } from '@ory/nextjs/app'

import config from '@/ory.config'
import Link from 'next/link'
import { LoginForm } from './login-form'

export default async function LoginPage({ searchParams }: OryPageParams) {
  const params = await searchParams
  if (!('flow' in params)) {
    return (
      <div className="mx-auto flex w-auto flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">
          No flow.&nbsp;
          <Link
            href={{
              pathname: `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser`,
              query: {
                return_to: 'return_to' in params ? params.return_to : '/',
              },
            }}
            className="text-blue-500 underline hover:text-blue-600"
          >
            Please try again.
          </Link>
        </h1>
        <p className="text-sm text-muted-foreground">
          If the problem persists, please contact Pickle support.
        </p>
      </div>
    )
  }

  const flow = await getLoginFlow(config, searchParams)
  if (!flow) {
    return null
  }

  return <LoginForm flow={flow} />
}
