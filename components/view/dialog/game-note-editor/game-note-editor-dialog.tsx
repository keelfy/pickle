"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { useOrderStore } from "@/providers/order";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";
import { ModalType } from "@/stores/modal";

const DynamicGameNoteEditorDialogContent = dynamic(
    () => import("./game-note-editor-dialog-content"),
    { loading: () => <LoadingDialogContent /> }
);

export default function GameNoteEditorDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore(
        (state) => state
    );

    const isOpen = React.useMemo(
        () =>
            currentModal === ModalType.CreateGameNote &&
            modalParams?.orderId &&
            modalParams?.title,
        [currentModal, modalParams?.orderId]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicGameNoteEditorDialogContent />}
            </DialogContent>
        </Dialog>
    );
}
