"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicMovieNoteCreatorDialogContent = dynamic(
    () => import("./movie-note-creator-dialog-content"),
    { loading: () => <LoadingDialogContent /> }
);

export type MovieNoteCreatorDialogParams = {
    movieId: string;
}

export default function MovieNoteCreatorDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore(
        (state) => state
    );

    const isOpen = React.useMemo(
        () => currentModal === ModalType.MovieNoteCreator,
        [currentModal, modalParams?.movieId]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicMovieNoteCreatorDialogContent movieId={modalParams?.movieId} />}
            </DialogContent>
        </Dialog>
    );
}
