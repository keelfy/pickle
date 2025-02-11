import { createStore } from "zustand";
import { devtools } from "zustand/middleware";

export enum ModalType {
    None = "none",
    ApproveOrder = "approve-order",
    RejectOrder = "reject-order",
    CreateOrder = "create-order",
    GameNote = "game-note",
    GameNoteEditor = "game-note-editor",
    ProfileSearch = "profile-search",
    ProfileSettings = "profile-settings",
    DeleteContentAlert = "delete-content-alert",
    CreateCollection = "create-collection",
    DeleteCollectionAlert = "delete-collection-alert",
    EditCollection = "edit-collection",
    AddCollectionItem = "add-collection-item",
}

type Action = {
    openModal: (modalName: ModalType, params?: Record<string, any>) => void;
    setModalParams: (params: Record<string, any>) => void;
    closeModal: () => void;
}

type State = {
    currentModal: ModalType;
    modalParams?: any;
}

export type ModalStore = Action & State;

const defaultInitialState: State = {
    currentModal: ModalType.None,
    modalParams: {},
}

const createModalStore = (initialState: State = defaultInitialState) => {
    return createStore<ModalStore>()(devtools((set) => ({
        ...initialState,
        openModal: (modalName, params) => set(() => ({
            currentModal: modalName,
            modalParams: params ?? {}
        })),
        setModalParams: (params) => set((state) => ({ ...state, modalParams: params })),
        closeModal: () => set(() => defaultInitialState),
    })))
}

export default createModalStore;
