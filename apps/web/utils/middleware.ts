import getCurrentSession from '@/hooks/getCurrentSession'
import { fetchOry } from '@/lib/ory'
import { type NextRequest, NextResponse } from 'next/server'

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const session = await getCurrentSession()
  if (session && !session.active) {
    const res = await fetchOry(`/admin/sessions/${session.id}/extend`, {
      method: 'PATCH',
    })

    if (res.status === 204) {
      response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
    } else {
      return NextResponse.redirect(
        new URL(
          `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser?return_to=${request.nextUrl.pathname}`,
          request.nextUrl.origin,
        ),
      )
    }
  }
  return response
}
