"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicMovieNoteEditorDialogContent = dynamic(
    () => import("./movie-note-editor-dialog-content"),
    { loading: () => <LoadingDialogContent /> }
);

export default function MovieNoteEditorDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore(
        (state) => state
    );

    const isOpen = React.useMemo(
        () => currentModal === ModalType.MovieNoteCreator ||
            (currentModal === ModalType.MovieNoteEditor && modalParams?.id !== undefined),
        [currentModal, modalParams?.id]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicMovieNoteEditorDialogContent noteId={modalParams?.id} />}
            </DialogContent>
        </Dialog>
    );
}
