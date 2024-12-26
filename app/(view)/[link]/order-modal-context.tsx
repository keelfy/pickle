"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { createContext, useContext, useState } from "react";

type ModalContextType = {
    currentModal: ModalName | null;
    order: Order | null;
    openModal: (modalName: ModalName, order: Order | null) => void;
    closeModal: () => void;
};

const ModalContext = createContext<ModalContextType>({
    currentModal: null,
    order: null,
    openModal: () => {},
    closeModal: () => {},
});

export type ModalName =
    | "approve"
    | "deny"
    | "interactive-game-editor"
    | "approve-confirmation"
    | "search"
    | "create"
    | "profile-settings";

export const OrderModalProvider = ({
    children,
}: React.HTMLAttributes<HTMLDivElement>) => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [currentModal, setCurrentModal] = useState<ModalName | null>(null);
    const [order, setOrder] = useState<Order | null>(null);

    const clearModalParams = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("modal");
        router.push(pathname + "?" + params.toString());
    };

    const openModal = (modalName: ModalName, order?: Order | null) => {
        setCurrentModal(modalName);
        setOrder(order ?? null);
        console.log("Opened modal", modalName);
    };

    const closeModal = () => {
        setCurrentModal(null);
        setOrder(null);
        clearModalParams();
    };

    React.useEffect(() => {
        if (searchParams.has("modal")) {
            const modalName = searchParams.get("modal") as ModalName;
            openModal(modalName, null);
        }
    }, [searchParams]);

    return (
        <ModalContext.Provider
            value={{ currentModal, order, openModal, closeModal }}
        >
            {children}
        </ModalContext.Provider>
    );
};

export const useOrderModal = () => useContext(ModalContext);
