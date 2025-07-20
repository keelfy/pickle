import { PublicProfile } from '@/utils/api/types';
import { Session } from '@ory/client-fetch';
import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';

type Actions = {
    updateProfile: (profile: PublicProfile) => void
    updateSession: (session: Session) => void
    clearSession: () => void
}

type State = {
    profile: PublicProfile | undefined;
    session: Session | undefined;
};

export type AuthStore = Actions & State;

const defaultInitialState: State = {
    profile: undefined,
    session: undefined,
}

const createAuthStore = (initialState: State = defaultInitialState) => {
    return createStore<AuthStore>()(devtools((set) => ({
        ...initialState,
        updateProfile: (profile) => set(() => ({ profile })),
        updateSession: (session) => set(() => ({ session })),
        clearSession: () => set(() => ({ ...initialState })),
    })))
}

export default createAuthStore;
