"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import dynamic from "next/dynamic";
import React from "react";
import LoadingDialogContent from "../loading-dialog-content";
import { ContentCategory } from "@/utils/api/types";

const DynamicRenameGameNoteDialogContent = dynamic(
    () => import("./rename-note-dialog-content"),
    {
        loading: () => <LoadingDialogContent />,
    }
);

export type RenameGameNoteModalParams = {
    id: string;
    name: string;
}

type Props = {
    category: ContentCategory;
}

export default function RenameGameNoteDialog({ category }: Props) {
    const { currentModal, closeModal, modalParams } = useModalStore((state) => state);

    const isOpen = React.useMemo(
        () => currentModal === ModalType.RenameGameNote
            && modalParams?.id !== undefined
            && modalParams?.name !== undefined,
        [currentModal, modalParams]
    );

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeModal}>
            <DialogContent className="overflow-y-auto max-h-screen">
                {isOpen && <DynamicRenameGameNoteDialogContent category={category} />}
            </DialogContent>
        </Dialog>
    );
};
