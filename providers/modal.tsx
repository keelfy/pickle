"use client";

import React from "react";
import { useStore } from "zustand";

import createModalStore, { ModalStore } from "@/stores/modal";

export type ModalStoreApi = ReturnType<typeof createModalStore>;

export const ModalStoreContext = React.createContext<ModalStoreApi | undefined>(
    undefined
);

export interface ModalStoreProviderProps {
    children: React.ReactNode;
}

export default function ModalStoreProvider({
    children,
}: ModalStoreProviderProps) {
    const storeRef = React.useRef<ModalStoreApi>(createModalStore());

    return (
        <ModalStoreContext.Provider value={storeRef.current}>
            {children}
        </ModalStoreContext.Provider>
    );
}

export function useModalStore<T>(selector: (store: ModalStore) => T): T {
    const storeContext = React.useContext(ModalStoreContext);

    if (!storeContext) {
        throw new Error(`useModalStore must be used within ModalStoreProvider`);
    }

    return useStore(storeContext, selector);
}
