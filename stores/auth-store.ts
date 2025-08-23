import { DetailedUser } from '@/lib/model/user'
import { Session } from '@ory/client-fetch'
import { createStore } from 'zustand'
import { devtools } from 'zustand/middleware'

type Actions = {
  updateUser: (user: DetailedUser) => void
  updateSession: (session: Session) => void
  clearSession: () => void
}

type State = {
  user: DetailedUser | undefined
  session: Session | undefined
}

export type AuthStore = Actions & State

const defaultInitialState: State = {
  user: undefined,
  session: undefined,
}

const createAuthStore = (initialState: State = defaultInitialState) => {
  return createStore<AuthStore>()(
    devtools((set) => ({
      ...initialState,
      updateUser: (user) => set(() => ({ user })),
      updateSession: (session) => set(() => ({ session })),
      clearSession: () => set(() => ({ ...initialState })),
    })),
  )
}

export default createAuthStore
