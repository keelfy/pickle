"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/providers/modal";
import { useOrderStore } from "@/providers/order";
import { orderCategories, orderStatuses } from "@/utils/api/constants";
import { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";

const orderColumns: ColumnDef<Order>[] = [
    {
        accessorKey: "ordererUsername",
        header: () => <Label>User</Label>,
    },
    {
        accessorKey: "categoryType",
        header: () => <Label>Category</Label>,
        cell: ({ row }) => {
            const categoryType = row.getValue("categoryType") as number;
            const label = orderCategories.find(
                (category) => category.idx === categoryType
            )?.label;
            return <div>{label}</div>;
        },
    },
    {
        accessorKey: "message",
        header: () => <Label>Message</Label>,
        cell: ({ row }) => (
            <div className="max-w-96 text-wrap">{row.getValue("message")}</div>
        ),
    },
    {
        accessorKey: "status",
        header: () => <Label>Status</Label>,
        cell: ({ row }) => {
            const status = row.getValue("status") as number;
            const label = orderStatuses.find(
                (statusItem) => statusItem.idx === status
            )?.label;
            return (
                <Badge
                    variant={
                        status == 2
                            ? "destructive"
                            : status == 1
                              ? "default"
                              : "outline"
                    }
                >
                    {label}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: () => <Label>Date</Label>,
        cell: ({ row }) => (
            <div className="text-start">
                {new Date(row.getValue("createdAt")).toLocaleDateString()}
            </div>
        ),
    },
];

const orderAuthorizedColumns: ColumnDef<Order>[] = [
    {
        id: "actions",
        header: () => <Label>Actions</Label>,
        cell: ({ row }) => {
            const order = row.original;
            const { openModal } = useModalStore((state) => state);
            const { setOrder } = useOrderStore((state) => state);

            if (order.status !== 0) {
                return null;
            }

            return (
                <div className="flex items-center text-center">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => {
                            openModal("deny");
                            setOrder(order);
                        }}
                    >
                        <X />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-green-500"
                        onClick={() => {
                            openModal("approve");
                            setOrder(order);
                        }}
                    >
                        <Check />
                    </Button>
                </div>
            );
        },
    },
];

export const getOrderTableColumns = (
    authorizedUser: boolean
): ColumnDef<Order>[] => {
    if (authorizedUser) {
        return [...orderColumns, ...orderAuthorizedColumns];
    }
    return orderColumns;
};
