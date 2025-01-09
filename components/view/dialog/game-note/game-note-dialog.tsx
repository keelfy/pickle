"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { useNoteStore } from "@/providers/note-store";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicGameNoteDialogContent = dynamic(
    () => import("./game-note-dialog-content"),
    {
        loading: () => <LoadingDialogContent />,
    }
);

export default function GameNoteDialog() {
    const { currentModal, closeModal } = useModalStore((state) => state);
    const { shortNote, category } = useNoteStore((state) => state);

    const isOpen = useMemo(
        () =>
            currentModal === "game-note" &&
            shortNote?.id !== undefined &&
            category == 1,
        [currentModal, shortNote?.id, category]
    );

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-scroll max-h-screen">
                {isOpen && <DynamicGameNoteDialogContent />}
            </DialogContent>
        </Dialog>
    );
}
