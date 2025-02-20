"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import React from "react";
import dynamic from "next/dynamic";
import LoadingAlertDialogContent from "../loading-alert-dialog-content";
import { ContentCategory } from "@/utils/api/types";

const DynamicDeleteContentAlertDialogContent = dynamic(
    () => import("./delete-content-alert-dialog-content"),
    {
        loading: () => <LoadingAlertDialogContent />,
    }
);

export type DeleteContentAlertModalParams = {
    category: ContentCategory;
    title: string;
    id: string;
}

export default function DeleteContentAlertDialog() {
    const { currentModal, closeModal } = useModalStore(
        (state) => state
    );

    const modalParams = useModalStore<DeleteContentAlertModalParams>(state => state.modalParams!);

    const isOpen = React.useMemo(
        () => currentModal === ModalType.DeleteContentAlert
            && modalParams?.id !== undefined
            && modalParams?.category !== undefined
            && modalParams?.title !== undefined,
        [currentModal, modalParams?.id, modalParams?.category, modalParams?.title]
    );

    return (
        <AlertDialog open={isOpen} onOpenChange={closeModal}>
            <AlertDialogContent>
                {isOpen && <DynamicDeleteContentAlertDialogContent />}
            </AlertDialogContent>
        </AlertDialog>
    )
}