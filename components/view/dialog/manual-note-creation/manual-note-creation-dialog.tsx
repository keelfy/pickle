"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicManualNoteCreationDialogContent = dynamic(
    () => import("./manual-note-creation-dialog-content"),
    {
        loading: () => <LoadingDialogContent />,
    }
);

export default function ManualNoteCreationDialog() {
    const { currentModal, closeModal } = useModalStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal === ModalType.ManualNoteCreation,
        [currentModal]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicManualNoteCreationDialogContent />}
            </DialogContent>
        </Dialog>
    );
};
