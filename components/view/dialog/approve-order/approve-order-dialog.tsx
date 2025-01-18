"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicApproveOrderDialogContent = dynamic(
    () => import("./approve-order-dialog-content"),
    {
        loading: () => <LoadingDialogContent />,
    }
);

export default function ApproveOrderDialog() {
    const { currentModal, modalParams, closeModal } = useModalStore(
        (state) => state
    );

    const isOpen = React.useMemo(
        () =>
            currentModal === ModalType.ApproveOrder &&
            modalParams?.id !== undefined,
        [currentModal, modalParams?.id]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicApproveOrderDialogContent />}
            </DialogContent>
        </Dialog>
    );
}
