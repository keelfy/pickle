"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useModalStore } from "@/providers/modal";
import { useOrderStore } from "@/providers/order";
import dynamic from "next/dynamic";
import React from "react";
import LoadingAlertDialogContent from "../loading-alert-dialog-content";
import { ModalType } from "@/stores/modal";

const DynamicDenyOrderDialogContent = dynamic(
    () => import("./deny-order-dialog-content"),
    {
        loading: () => <LoadingAlertDialogContent />,
    }
);

export default function DenyOrderDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore(
        (state) => state
    );

    const isOpen = React.useMemo(
        () =>
            currentModal === ModalType.RejectOrder &&
            modalParams?.id !== undefined,
        [currentModal, modalParams?.id]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={closeModal}>
            <AlertDialogContent>
                {isOpen && <DynamicDenyOrderDialogContent />}
            </AlertDialogContent>
        </AlertDialog>
    );
}
