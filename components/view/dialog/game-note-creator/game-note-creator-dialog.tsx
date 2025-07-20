"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicGameNoteCreatorDialogContent = dynamic(
    () => import("./game-note-creator-dialog-content"),
    { loading: () => <LoadingDialogContent /> }
);

export type GameNoteCreatorDialogParams = {
    gameId: string;
}

export default function GameNoteCreatorDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore(
        (state) => state
    );

    const isOpen = React.useMemo(
        () => currentModal === ModalType.GameNoteCreator,
        [currentModal, modalParams?.gameId]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicGameNoteCreatorDialogContent gameId={modalParams?.gameId} />}
            </DialogContent>
        </Dialog>
    );
}
