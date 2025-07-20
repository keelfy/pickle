"use client";

import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ContentCategoryIcon from "@/components/ui/content-category-icon";
import { fetchProfileOrders } from "@/hooks/api-endpoints-client";
import { getTimeAgoText, localizeContentCategory, localizeOrderSource } from "@/lib/localize-types";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import { Order, OrderStatus } from "@/utils/api/types";
import { CheckIcon, XIcon } from "lucide-react";
import React from "react";
import { getOrderTableColumns } from "../columns";
import { DataTable } from "../data-table";

type Props = {
    placeholder?: React.ReactNode;
};

const orderStatusLabels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
}

const orderStatusBadgeVariants: Record<OrderStatus, BadgeProps["variant"]> = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
}

export default function OrdersDataTable({ placeholder }: Props) {
    const profile = useProfileStore((state) => state.profile);

    const [orders, setOrders] = React.useState<Order[]>([]);
    // const { isConnected, reconnect } = useOrdersWebSocket({
    //     userId: profile?.id ?? '',
    //     onNewOrder: (order) => {
    //         // TODO: exists check
    //         setOrders((prev) => [order, ...prev]);
    //     },
    //     onConnectionChange: (isConnected) => { }
    // });
    const [cursor, setCursor] = React.useState<string>(
        new Date("1900-01-24").toISOString()
    );

    const { openModal } = useModalStore((state) => state);

    const isAuthorized = profile?.isAuthorized ?? false;

    React.useEffect(() => {
        if (!profile) return
        (async () => {
            try {
                const orders = await fetchProfileOrders(profile, cursor, 'orders.created_at', 10, 'desc');
                setOrders(orders ?? []);
            } catch (error: any) {
                console.log(error);
            }
        })();
    }, [profile?.id]);

    return (
        <div className="flex flex-col gap-4">
            {orders.map((order) => (
                <div key={order.id} className="flex items-stretch">
                    <div className={cn("border rounded-md p-4 flex justify-between flex-1 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary-foreground text-secondary-foreground shadow-sm hover:bg-primary-foreground/80", isAuthorized && "rounded-r-none")}>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-1">
                                <ContentCategoryIcon category={order.category} className="size-5" />&nbsp;
                                <h2 className="text-md font-bold">{order.message}</h2>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                by&nbsp;<span className="font-bold">{order.ordererDisplayName}</span>
                                &nbsp;via&nbsp;<span className="text-muted-foreground">{localizeOrderSource(order.source)}</span>&nbsp;&bull;&nbsp;
                                {getTimeAgoText(order.createdAt)} ago
                            </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end justify-center">
                            <Badge variant={orderStatusBadgeVariants[order.status]}>
                                {orderStatusLabels[order.status]}
                            </Badge>
                        </div>
                    </div>
                    {isAuthorized && (
                        <div className="flex flex-col">
                            <Button
                                variant='outline'
                                disabled={order.status !== "pending"}
                                className="h-full rounded-none rounded-tr-md bg-primary-foreground hover:bg-primary-foreground/80"
                                onClick={() => {
                                    openModal(ModalType.ApproveOrder, { id: order.id });
                                }}
                            >
                                <CheckIcon className="w-4 h-4 text-green-500" /> Accept
                            </Button>
                            <Button
                                variant='outline'
                                disabled={order.status !== "pending"}
                                className="h-full rounded-none rounded-br-md bg-primary-foreground hover:bg-primary-foreground/80"
                                onClick={() => {
                                    openModal(ModalType.RejectOrder, {
                                        id: order.id,
                                        message: order.message,
                                        orderer: order.ordererDisplayName,
                                    });
                                }}
                            >
                                <XIcon className="w-4 h-4 text-red-500" /> Reject
                            </Button>
                        </div>
                    )}
                </div>
            ))
            }
        </div >
    )
}
