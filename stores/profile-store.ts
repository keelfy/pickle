import { User } from '@supabase/supabase-js';
import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';

type Actions = {
    updateProfile: (profile: Profile) => void
    updateUser: (user: User) => void
    clearUser: () => void
}

type State = {
    profile: Profile | undefined;
    user: User | undefined;
};

export type ProfileStore = Actions & State;

const defaultInitialState: State = {
    profile: undefined,
    user: undefined,
}

// Create your store, which includes both state and (optionally) actions
const createProfileStore = (initialState: State = defaultInitialState) => {
    return createStore<ProfileStore>()(devtools((set) => ({
        ...initialState,
        updateProfile: (profile) => set(() => ({ profile: profile })),
        updateUser: (user) => set(() => ({ user: user })),
        clearUser: () => set(() => ({ ...initialState })),
    })))
}

export default createProfileStore;
