"use client";

import { DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";
import { ModalType } from "@/stores/modal";

const DynamicProfileSettingsDialogContent = dynamic(
    () => import("./profile-settings-dialog-content"),
    { loading: () => <LoadingDialogContent /> }
);

export default function ProfileSettingsDialog() {
    const { currentModal } = useModalStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal == ModalType.ProfileSettings,
        [currentModal]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <DialogContent className="overflow-y-auto max-h-screen max-w-2xl p-0 flex flex-col gap-0">
            {isOpen && <DynamicProfileSettingsDialogContent />}
        </DialogContent>
    );
}
