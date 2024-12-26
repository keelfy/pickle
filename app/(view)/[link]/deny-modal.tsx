"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchApi } from "@/utils/api/client";
import { useOrderModal } from "./order-modal-context";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Check, X } from "lucide-react";

const DenyModal = () => {
    const { currentModal, order, closeModal } = useOrderModal();
    const { toast } = useToast();
    const [isLoading, startTransition] = React.useTransition();

    if (currentModal !== "deny" || !order) {
        return null;
    }

    const onConfirm = () =>
        startTransition(async () => {
            try {
                const rejectedOrder = await fetchApi<Order>(
                    `/v1/orders/${order.id}`,
                    true,
                    {
                        method: "PATCH",
                        body: JSON.stringify({ status: 2 }),
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
        <AlertDialog open={currentModal === "deny"} onOpenChange={closeModal}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You're about to cancel suggestion of
                        <br />
                        <span className="font-semibold">{order.message}</span>
                        &nbsp;from&nbsp;
                        <span className="font-semibold">
                            {order.ordererUsername}
                        </span>
                        .
                        <br />
                        <br />
                        By cancelling the suggestion, the user who ordered will
                        not be notified and money will not be refunded.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={closeModal}
                        disabled={isLoading}
                    >
                        <X />
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? <LoadingSpinner /> : <Check />}
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DenyModal;
