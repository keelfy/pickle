"use client";

import { Button } from "@/components/ui/button";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import React from "react";

type Props = {
    className?: string;
}

export default function ManualNoteCreationButton({ children, ...props }: React.PropsWithChildren<Props>) {
    const openModal = useModalStore((state) => state.openModal);
    const handleClick = () => openModal(ModalType.ManualNoteCreation);

    return (
        <Button variant="secondary" onClick={handleClick} {...props}>
            {children}
        </Button>
    )
}
