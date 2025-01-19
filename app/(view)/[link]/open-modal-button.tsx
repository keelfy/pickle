"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import React from "react";

type Props = ButtonProps & {
    modal: ModalType;
    children?: React.ReactNode;
};

export default function OpenModalButton({ modal, children, ...props }: Props) {
    const { openModal } = useModalStore((state) => state);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                openModal(modal);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <Button onClick={() => openModal(modal)} {...props}>
            {children}
        </Button>
    );
}
