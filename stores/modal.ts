import { createStore } from "zustand";
import { devtools } from "zustand/middleware";

export type ModalName =
    | "approve"
    | "deny"
    | "interactive-game-editor"
    | "approve-confirmation"
    | "search"
    | "create"
    | "profile-settings";

type Action = {
    openModal: (modalName: ModalName) => void;
    closeModal: () => void;
}

type State = {
    currentModal: ModalName | undefined;
}

export type ModalStore = Action & State;

const defaultInitialState: State = {
    currentModal: undefined,
}

const createModalStore = (initialState: State = defaultInitialState) => {
    return createStore<ModalStore>()(devtools((set) => ({
        ...initialState,
        openModal: (modalName) => set(() => ({
            currentModal: modalName,
        })),
        closeModal: () => set(() => ({
            currentModal: undefined
        })),
    })))
}

export default createModalStore;
