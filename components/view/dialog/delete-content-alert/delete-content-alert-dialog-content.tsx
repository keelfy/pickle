"use client";

import { AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteContent } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { Check, X } from "lucide-react";
import React from "react";
import { DeleteContentAlertModalParams } from "./delete-content-alert-dialog";

export default function DeleteContentAlertDialogContent() {
    const { closeModal } = useModalStore(
        (state) => state
    );
    const profile = useProfileStore((state) => state.profile);
    const modalParams = useModalStore<DeleteContentAlertModalParams | undefined>(state => state.modalParams);
    const [isLoading, startTransition] = React.useTransition();
    const [resetApprovedOrders, setResetApprovedOrders] = React.useState(true);

    const onConfirm = () => {
        if (!modalParams?.type || !modalParams?.id) return;
        startTransition(async () => {
            try {
                await deleteContent(profile, modalParams?.type, modalParams?.id, resetApprovedOrders);
                closeModal();
                toast({
                    title: "Content deleted successfully",
                    description: `The content ${modalParams?.title} has been deleted.`,
                });
            } catch (error: any) {
                toast({
                    title: "Failed to delete content",
                    description: error.message
                        ? error.message
                        : "Please try again later.",
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
                    You're about to delete&nbsp;<span className="font-semibold">{modalParams?.title}</span>.
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={resetApprovedOrders}
                            onCheckedChange={() => setResetApprovedOrders(!resetApprovedOrders)}
                        />
                        <span>Set all related orders back to pending status</span>
                    </div>
                    <div className="text-destructive">
                        This action cannot be undone.
                    </div>
                </div>
            </div>

            <AlertDialogFooter>
                <AlertDialogCancel onClick={closeModal} disabled={isLoading}>
                    <X />
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
                    <Check />
                    Confirm
                </AlertDialogAction>
            </AlertDialogFooter>
        </>
    )
}