"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { useOrderStore } from "@/providers/order";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicGameNoteEditorDialogContent = dynamic(
    () => import("./game-note-editor-dialog-content"),
    { loading: () => <LoadingDialogContent /> }
);

export default function GameNoteEditorDialog() {
    const { currentModal, closeModal } = useModalStore((state) => state);
    const { order } = useOrderStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal === "game-note-editor" && order?.id !== undefined,
        [currentModal, order?.id]
    );

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-scroll max-h-screen">
                {isOpen && <DynamicGameNoteEditorDialogContent />}
            </DialogContent>
        </Dialog>
    );
}
