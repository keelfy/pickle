import { Profile } from '@/lib/model/user'
import { createStore } from 'zustand'
import { devtools } from 'zustand/middleware'

type Actions = {
  update: (profile: Profile) => void
  clear: () => void
}

type State = {
  profile: Profile | undefined
}

export type ProfileStore = Actions & State

const defaultInitialState: State = {
  profile: undefined,
}

export default function createProfileStore(
  initialState: State = defaultInitialState,
) {
  return createStore<ProfileStore>()(
    devtools((set) => ({
      ...initialState,
      update: (profile) => set(() => ({ profile })),
      clear: () => set(() => ({ ...initialState })),
    })),
  )
}
