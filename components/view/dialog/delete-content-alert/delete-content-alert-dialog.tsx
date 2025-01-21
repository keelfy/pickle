"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import React from "react";
import dynamic from "next/dynamic";
import LoadingAlertDialogContent from "../loading-alert-dialog-content";

const DynamicDeleteContentAlertDialogContent = dynamic(
    () => import("./delete-content-alert-dialog-content"),
    {
        loading: () => <LoadingAlertDialogContent />,
    }
);

export enum DeleteContentType {
    GameNote = "game-notes",
}

export type DeleteContentAlertModalParams = {
    type: DeleteContentType;
    title: string;
    id: string;
}

export default function DeleteContentAlertDialog() {
    const { currentModal, closeModal } = useModalStore(
        (state) => state
    );

    const modalParams = useModalStore<DeleteContentAlertModalParams | undefined>(state => state.modalParams);

    const isOpen = React.useMemo(
        () => currentModal === ModalType.DeleteContentAlert
            && modalParams?.id !== undefined
            && modalParams?.type !== undefined
            && modalParams?.title !== undefined,
        [currentModal, modalParams?.id, modalParams?.type, modalParams?.title]
    );

    return (
        <AlertDialog open={isOpen} onOpenChange={closeModal}>
            <AlertDialogContent>
                {isOpen && <DynamicDeleteContentAlertDialogContent />}
            </AlertDialogContent>
        </AlertDialog>
    )
}