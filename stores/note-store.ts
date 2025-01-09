import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';

type Actions = {
    setShortNote: (note: GameNote, category: number) => void
    clear: () => void
}

type State = {
    shortNote: GameNote | undefined;
    category: number | undefined;
};

export type NoteStore = Actions & State;

const defaultInitialState: State = {
    shortNote: undefined,
    category: undefined,
}

// Create your store, which includes both state and (optionally) actions
export default function createProfileStore(initialState: State = defaultInitialState) {
    return createStore<NoteStore>()(devtools((set) => ({
        ...initialState,
        setShortNote: (shortNote, category) => set(() => ({ shortNote: shortNote, category: category })),
        clear: () => set(() => ({ ...initialState })),
    })))
}
