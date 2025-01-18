"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import LoadingDialogContent from "../loading-dialog-content";
import { ModalType } from "@/stores/modal";

const DynamicGameNoteDialogContent = dynamic(
    () => import("./game-note-dialog-content"),
    {
        loading: () => <LoadingDialogContent />,
    }
);

export default function GameNoteDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore(
        (state) => state
    );

    // modalParams contains an id of the note
    const isOpen = useMemo(
        () =>
            currentModal === ModalType.GameNote &&
            modalParams?.id !== undefined,
        [currentModal, modalParams?.id]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicGameNoteDialogContent />}
            </DialogContent>
        </Dialog>
    );
}
