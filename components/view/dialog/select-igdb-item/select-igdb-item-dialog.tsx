"use client";

import { CommandDialog } from "@/components/ui/command";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import React from "react";
import SelectIGDBItemDialogContent from "./select-igdb-item-dialog-content";

export default function SelectIGDBItemDialog() {
    const { currentModal, closeModal } = useModalStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal == ModalType.SelectIGDBItem,
        [currentModal]
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
            {isOpen && <SelectIGDBItemDialogContent />}
        </CommandDialog>
    );
}
