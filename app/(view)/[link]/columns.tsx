"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useOrderModal } from "./order-modal-context";

export const columns: ColumnDef<Order>[] = [
    {
        accessorKey: "ordererUsername",
        header: () => <div>Orderer</div>,
    },
    {
        accessorKey: "categoryType",
        header: () => <div>Category</div>,
        cell: ({ row }) => <div>{row.getValue("categoryType")}</div>,
    },
    {
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => (
            <div className="max-w-96 text-wrap">
                {row.getValue("message")}
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: () => <div>Status</div>,
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge
                    variant={
                        status == "denied"
                            ? "destructive"
                            : status == "approved"
                              ? "default"
                              : "outline"
                    }
                >
                    {status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: () => <div>Date</div>,
        cell: ({ row }) => (
            <div className="text-right">
                {new Date(row.getValue("createdAt")).toLocaleDateString()}
            </div>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const order = row.original;
            const { openModal } = useOrderModal();

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openModal("approve", order)}>
                            Approve
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View customer</DropdownMenuItem>
                        <DropdownMenuItem>
                            View payment details
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
