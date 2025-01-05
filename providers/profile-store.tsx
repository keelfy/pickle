"use client";

import React from "react";
import { useStore } from "zustand";

import createProfileStore, { ProfileStore } from "@/stores/profile-store";
import { User } from "@supabase/supabase-js";

export type ProfileStoreApi = ReturnType<typeof createProfileStore>;

export const ProfileStoreContext = React.createContext<
    ProfileStoreApi | undefined
>(undefined);

export type ProfileStoreProviderProps = React.PropsWithChildren<{
    profile: Profile | undefined;
    user: User | undefined;
}>;

export default function ProfileStoreProvider({
    children,
    ...props
}: ProfileStoreProviderProps) {
    const storeRef = React.useRef<ProfileStoreApi>(createProfileStore(props));

    return (
        <ProfileStoreContext.Provider value={storeRef.current}>
            {children}
        </ProfileStoreContext.Provider>
    );
}

export function useProfileStore<T>(selector: (store: ProfileStore) => T): T {
    const storeContext = React.useContext(ProfileStoreContext);

    if (!storeContext) {
        throw new Error(
            `useProfileStore must be used within ProfileStoreProvider`
        );
    }

    return useStore(storeContext, selector);
}
