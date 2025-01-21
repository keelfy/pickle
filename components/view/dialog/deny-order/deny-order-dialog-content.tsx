"use client";

import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { updateOrder } from "@/hooks/api-endpoints-client";
import { useToast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { Check, X } from "lucide-react";
import React from "react";

export default function DenyOrderDialogContent() {
    const { closeModal } = useModalStore((state) => state);
    const profile = useProfileStore((state) => state.profile);
    const { id, message, orderer } = useModalStore(
        (state) => state.modalParams!
    );

    const { toast } = useToast();
    const [isLoading, startTransition] = React.useTransition();

    const onConfirm = () =>
        startTransition(async () => {
            try {
                const rejectedOrder = await updateOrder(profile, id, {
                    status: "rejected",
                });
                closeModal();
                toast({
                    title: `Order rejected successfully`,
                    description: `${rejectedOrder?.ordererUsername} will not be notified!`,
                });
            } catch (error: any) {
                toast({
                    title: "Failed to reject order",
                    description: error.message
                        ? error.message
                        : "Please try again later.",
                });
            }
        });

    return (
        <>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            </AlertDialogHeader>

            <div>
                You're about to cancel suggestion of
                <br />
                <span className="font-semibold">{message}</span>
                &nbsp;from&nbsp;
                <span className="font-semibold">{orderer}</span>
                .
                <br />
                <br />
                By cancelling the suggestion, the user who ordered will not
                be notified and money will not be refunded.
            </div>

            <AlertDialogFooter>
                <AlertDialogCancel onClick={closeModal} disabled={isLoading}>
                    <X />
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? <LoadingSpinner /> : <Check />}
                    Confirm
                </AlertDialogAction>
            </AlertDialogFooter>
        </>
    );
}
