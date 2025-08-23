import { getRegistrationFlow, OryPageParams } from '@ory/nextjs/app'

import config from '@/ory.config'
import { RegistrationForm } from './registration-form'

export default async function RegistrationPage(props: OryPageParams) {
  const flow = await getRegistrationFlow(config, props.searchParams)
  if (!flow) {
    return null
  }

  return <RegistrationForm flow={flow} />
}
