"use client";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useModalStore } from "@/providers/modal";
import { useOrderStore } from "@/providers/order";
import dynamic from "next/dynamic";
import React from "react";
import LoadingAlertDialogContent from "../loading-alert-dialog-content";

const DynamicDenyOrderDialogContent = dynamic(
    () => import("./deny-order-dialog-content"),
    {
        loading: () => <LoadingAlertDialogContent />,
    }
);

export default function DenyOrderDialog() {
    const { currentModal, closeModal } = useModalStore((state) => state);
    const { order } = useOrderStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal === "deny" && order?.id !== undefined,
        [currentModal, order?.id]
    );

    return (
        <AlertDialog open={isOpen} onOpenChange={closeModal}>
            <AlertDialogContent>
                {isOpen && <DynamicDenyOrderDialogContent />}
            </AlertDialogContent>
        </AlertDialog>
    );
}
