"use client";

import { createContext, useContext, useState } from "react";

type ModalContextType = {
    currentModal: ModalName | null;
    order: Order | null;
    openModal: (modalName: ModalName, order: Order) => void;
    closeModal: () => void;
};

const ModalContext = createContext<ModalContextType>({
    currentModal: null,
    order: null,
    openModal: () => {},
    closeModal: () => {},
});

type ModalName =
    | "approve"
    | "deny"
    | "interactive-game-editor"
    | "approve-confirmation";

export const OrderModalProvider = ({
    children,
}: React.HTMLAttributes<HTMLDivElement>) => {
    const [currentModal, setCurrentModal] = useState<ModalName | null>(null);
    const [order, setOrder] = useState<Order | null>(null);

    const openModal = (modalName: ModalName, order: Order) => {
        setCurrentModal(modalName);
        setOrder(order);
    };

    const closeModal = () => {
        setCurrentModal(null);
        setOrder(null);
    };

    return (
        <ModalContext.Provider
            value={{ currentModal, order, openModal, closeModal }}
        >
            {children}
        </ModalContext.Provider>
    );
};

export const useOrderModal = () => useContext(ModalContext);
