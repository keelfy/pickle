"use client";

import { AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteCollection } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { Trash, X } from "lucide-react";
import React from "react";
import { DeleteCollectionAlertModalParams } from "./delete-collection-alert-dialog";

export default function DeleteContentAlertDialogContent() {
    const { closeModal } = useModalStore(
        (state) => state
    );
    const modalParams = useModalStore<DeleteCollectionAlertModalParams | undefined>(state => state.modalParams);
    const [isLoading, startTransition] = React.useTransition();

    const onConfirm = () => {
        if (!modalParams?.id) return;
        
        startTransition(async () => {
            try {
                await deleteCollection(modalParams?.id);
                closeModal();
                toast({
                    title: "Collection deleted successfully",
                    description: `The collection ${modalParams?.name} has been deleted.`,
                });
            } catch (error: any) {
                toast({
                    title: "Failed to delete content",
                    description: error.message ?? "Please try again later.",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="flex flex-col gap-2 text-sm">
                <div>
                    You're about to delete collection&nbsp;"<span className="font-semibold">{modalParams?.name}</span>".
                </div>

                <div className="text-destructive">
                    This action cannot be undone.
                </div>
            </div>

            <AlertDialogFooter>
                <AlertDialogCancel onClick={closeModal} disabled={isLoading}>
                    <X />
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
                    <Trash />
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </>
    )
}