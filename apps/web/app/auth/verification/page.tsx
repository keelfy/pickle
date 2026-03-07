'use client'

import ory from '@/lib/ory'
import {
  isResponseError,
  ResponseError,
  VerificationFlow,
} from '@ory/client-fetch'
import { redirect } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import React from 'react'
import VerificationForm from './verification-form'

export default function VerificationPage() {
  const [goto] = useQueryState('goto', parseAsString.withDefault('/'))
  const [flowId, setFlowId] = useQueryState(
    'flow',
    parseAsString.withDefault(''),
  )

  const [flow, setFlow] = React.useState<VerificationFlow>()
  const [isFlowLoading, startFlowTransition] = React.useTransition()

  React.useEffect(() => {
    if (flow) return

    startFlowTransition(async () => {
      let flow: VerificationFlow | undefined = undefined

      if (flowId.length > 0) {
        try {
          flow = await ory.getVerificationFlow({
            id: flowId,
          })
        } catch (error) {
          if (isResponseError(error)) {
            error.response
              .json()
              .then((res) =>
                console.log(
                  'Failed to load existing verification flow',
                  JSON.stringify(res.error.message),
                ),
              )
          }
          flow = undefined
        }
      }

      if (!flow) {
        try {
          flow = await ory.createBrowserVerificationFlow()
        } catch (error) {
          if (error instanceof ResponseError) {
            const res = await error.response.json()

            switch (res.error.id) {
              case 'session_inactive':
                return redirect(
                  `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser?return_to=${goto}`,
                )
              default:
                console.log(
                  'Failed to create verification flow',
                  JSON.stringify(res.error.message),
                )
                break
            }
          }
        }
      }

      setFlow(flow)
    })
  }, [])

  React.useEffect(() => {
    if (flowId !== flow?.id) {
      setFlowId(flow?.id ?? '')
    }
  }, [flow])

  return (
    <VerificationForm
      flow={flow}
      updateFlow={setFlow}
      isFlowLoading={isFlowLoading}
      className="mx-auto flex-1"
    />
  )
}
