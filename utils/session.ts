import { Session } from '@ory/client-fetch'

export function isSessionActive(session: Session | undefined) {
  return session?.active === true
}
