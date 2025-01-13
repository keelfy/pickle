import { User } from '@supabase/supabase-js';
import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';

type Actions = {
    updateProfile: (profile: Profile) => void
    updateUser: (user: User) => void
    updateAvatarUrl: (avatarUrl: string) => void
    clearUser: () => void
}

type State = {
    profile: Profile | undefined;
    user: User | undefined;
    avatarUrl?: string;
};

export type AuthStore = Actions & State;

const defaultInitialState: State = {
    profile: undefined,
    user: undefined,
}

// Create your store, which includes both state and (optionally) actions
const createAuthStore = (initialState: State = defaultInitialState) => {
    return createStore<AuthStore>()(devtools((set) => ({
        ...initialState,
        updateProfile: (profile) => set(() => ({ profile: profile })),
        updateUser: (user) => set(() => ({ user: user })),
        updateAvatarUrl: (avatarUrl) => set(() => ({ avatarUrl: avatarUrl })),
        clearUser: () => set(() => ({ ...initialState })),
    })))
}

export default createAuthStore;
