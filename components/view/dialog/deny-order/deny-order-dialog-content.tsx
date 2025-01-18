"use client";

import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { fetchApi } from "@/utils/api/client";
import { Check, X } from "lucide-react";
import React from "react";

export default function DenyOrderDialogContent() {
    const { closeModal } = useModalStore((state) => state);
    const { id, message, orderer } = useModalStore(
        (state) => state.modalParams!
    );

    const { toast } = useToast();
    const [isLoading, startTransition] = React.useTransition();

    const onConfirm = () =>
        startTransition(async () => {
            try {
                const req: Partial<Order> = {
                    status: "rejected",
                };
                const rejectedOrder = await fetchApi<Order>(
                    `/v1/orders/${id}`,
                    true,
                    {
                        method: "PATCH",
                        body: JSON.stringify(req),
                    }
                );
                closeModal();
                toast({
                    title: `Order rejected successfully`,
                    description: `${rejectedOrder.ordererUsername} will not be notified!`,
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
                <AlertDialogDescription>
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
                </AlertDialogDescription>
            </AlertDialogHeader>

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
