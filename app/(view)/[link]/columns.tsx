"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useOrderModal } from "./order-modal-context";
import { Label } from "@/components/ui/label";

export const columns: ColumnDef<Order>[] = [
    {
        accessorKey: "ordererUsername",
        header: () => <Label>User</Label>,
    },
    {
        accessorKey: "categoryType",
        header: () => <Label>Category</Label>,
        cell: ({ row }) => <div>{row.getValue("categoryType")}</div>,
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
        header: () => <Label>Date</Label>,
        cell: ({ row }) => (
            <div className="text-start">
                {new Date(row.getValue("createdAt")).toLocaleDateString()}
            </div>
        ),
    },
    {
        id: "actions",
        header: () => <Label className="text-center">Manage</Label>,
        cell: ({ row }) => {
            const order = row.original;
            const { openModal } = useOrderModal();

            return (
                <div className="text-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-center"
                            >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={() => openModal("approve", order)}
                            >
                                Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => openModal("deny", order)}
                            >
                                Deny
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
