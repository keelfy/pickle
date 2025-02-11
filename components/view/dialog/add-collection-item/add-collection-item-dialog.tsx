"use client";

import { CommandDialog } from "@/components/ui/command";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import React from "react";
import AddCollectionItemDialogContent from "./add-collection-item-dialog-content";

export default function AddCollectionItemDialog() {
    const { currentModal, closeModal, modalParams } = useModalStore((state) => state);
    const profile = useProfileStore((state) => state.profile);

    const isOpen = React.useMemo(
        () => currentModal == ModalType.AddCollectionItem
            && profile?.id !== undefined
            && modalParams?.id !== undefined,
        [currentModal, profile?.id, modalParams?.id]
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
            {isOpen && <AddCollectionItemDialogContent />}
        </CommandDialog>
    );
}
