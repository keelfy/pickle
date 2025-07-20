"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import LoadingDialogContent from "../loading-dialog-content";
import { ModalType } from "@/stores/modal";

const DynamicMovieNoteDialogContent = dynamic(
    () => import("./movie-note-dialog-content"),
    {
        loading: () => <LoadingDialogContent />,
    }
);

export type MovieNoteDialogParams = {
    noteId: string;
}

export default function MovieNoteDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore(
        (state) => state
    );

    const isOpen = useMemo(
        () =>
            currentModal === ModalType.MovieNote &&
            modalParams?.noteId !== undefined,
        [currentModal, modalParams?.noteId]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicMovieNoteDialogContent />}
            </DialogContent>
        </Dialog>
    );
}
