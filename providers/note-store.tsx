"use client";

import React from "react";
import { useStore } from "zustand";

import createNoteStore, { NoteStore } from "@/stores/note-store";

export type NoteStoreApi = ReturnType<typeof createNoteStore>;

export const NoteStoreContext = React.createContext<NoteStoreApi | undefined>(
    undefined
);

export type NoteStoreProviderProps = React.PropsWithChildren;

export default function NoteStoreProvider({
    children,
}: NoteStoreProviderProps) {
    const storeRef = React.useRef<NoteStoreApi>(createNoteStore());

    return (
        <NoteStoreContext.Provider value={storeRef.current}>
            {children}
        </NoteStoreContext.Provider>
    );
}

export function useNoteStore<T>(selector: (store: NoteStore) => T): T {
    const storeContext = React.useContext(NoteStoreContext);

    if (!storeContext) {
        throw new Error(`useNoteStore must be used within NoteStoreProvider`);
    }

    return useStore(storeContext, selector);
}
