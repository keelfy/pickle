"use client";

import { CommandDialog } from "@/components/ui/command";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import React from "react";
import SelectContentItemDialogContent from "./select-content-item-dialog-content";

export default function SelectContentItemDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal == ModalType.SelectContentItem && modalParams?.category !== undefined,
        [currentModal, modalParams]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <CommandDialog
            open={isOpen}
            onOpenChange={closeModal}
            commandProps={{ shouldFilter: false }}
        >
            {isOpen && <SelectContentItemDialogContent />}
        </CommandDialog>
    );
}
