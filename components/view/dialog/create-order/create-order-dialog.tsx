"use client";

import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicCreateOrderDialogContent = dynamic(
    () => import("./create-order-dialog-content"),
    {
        loading: () => <LoadingDialogContent />,
    }
);

type Props = {
    link: string;
};

const CreateOrderDialog = (props: Props) => {
    const { currentModal, closeModal } = useModalStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal === "create",
        [currentModal]
    );

    if (isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-scroll max-h-screen">
                {isOpen && <DynamicCreateOrderDialogContent {...props} />}
            </DialogContent>
        </Dialog>
    );
};

export default CreateOrderDialog;
