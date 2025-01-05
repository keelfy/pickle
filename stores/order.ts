import { createStore } from "zustand";
import { devtools } from "zustand/middleware";

type Action = {
    setOrder: (order: Order | undefined) => void;
}

type State = {
    order: Order | undefined;
};

export type OrderStore = Action & State;

const defaultInitialState: State = {
    order: undefined,
}

const createOrderStore = (initialState: State = defaultInitialState) => {
    return createStore<OrderStore>()(devtools((set) => ({
        ...initialState,
        setOrder: (order) => set(() => ({ order: order })),
    })))
}

export default createOrderStore;
