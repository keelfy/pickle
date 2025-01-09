"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { useOrderStore } from "@/providers/order";
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
    const { currentModal, closeModal } = useModalStore((state) => state);
    const { order } = useOrderStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal === "approve" && order?.id !== undefined,
        [currentModal, order?.id]
    );

    return (
        <Dialog open={currentModal === "approve"} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-scroll max-h-screen">
                {isOpen && <DynamicApproveOrderDialogContent />}
            </DialogContent>
        </Dialog>
    );
}
