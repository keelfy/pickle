"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";

const DynamicProfileSettingsDialogContent = dynamic(
    () => import("./profile-settings-dialog-content"),
    { loading: () => <LoadingDialogContent /> }
);

export default function ProfileSettingsDialog() {
    const { currentModal, closeModal } = useModalStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal == "profile-settings",
        [currentModal]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-scroll max-h-screen max-w-2xl p-0 flex flex-col gap-0">
                {isOpen && <DynamicProfileSettingsDialogContent />}
            </DialogContent>
        </Dialog>
    );
}
