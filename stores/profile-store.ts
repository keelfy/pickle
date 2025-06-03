import { Profile, PublicProfile } from '@/utils/api/types';
import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';

type Actions = {
    update: (profile: PublicProfile) => void
    clear: () => void
}

type State = {
    profile: PublicProfile | undefined;
};

export type ProfileStore = Actions & State;

const defaultInitialState: State = {
    profile: undefined,
}

// Create your store, which includes both state and (optionally) actions
export default function createProfileStore(initialState: State = defaultInitialState) {
    return createStore<ProfileStore>()(devtools((set) => ({
        ...initialState,
        update: (profile) => set(() => ({ profile: profile })),
        clear: () => set(() => ({ ...initialState })),
    })))
}
