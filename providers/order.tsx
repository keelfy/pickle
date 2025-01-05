"use client";

import { default as createOrderStore, OrderStore } from "@/stores/order";
import React from "react";
import { useStore } from "zustand";

export type OrderStoreApi = ReturnType<typeof createOrderStore>;

export const OrderStoreContext = React.createContext<OrderStoreApi | undefined>(
    undefined
);

export interface OrderStoreProviderProps {
    children: React.ReactNode;
}

export default function OrderStoreProvider({
    children,
}: OrderStoreProviderProps) {
    const storeRef = React.useRef<OrderStoreApi>(createOrderStore());

    return (
        <OrderStoreContext.Provider value={storeRef.current}>
            {children}
        </OrderStoreContext.Provider>
    );
}

export function useOrderStore<T>(selector: (store: OrderStore) => T): T {
    const storeContext = React.useContext(OrderStoreContext);

    if (!storeContext) {
        throw new Error(`useOrderStore must be used within OrderStoreProvider`);
    }

    return useStore(storeContext, selector);
}
