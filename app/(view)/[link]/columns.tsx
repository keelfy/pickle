"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import {
    contentCategoryLabels,
    orderStatusLabels,
} from "@/utils/api/constants";
import { SiYoutube } from "@icons-pack/react-simple-icons";
import { ColumnDef } from "@tanstack/react-table";
import {
    Check,
    Clapperboard,
    DollarSign,
    Gamepad,
    ListVideo,
    Loader,
    MonitorPlay,
    Squirrel,
    X,
} from "lucide-react";

const orderColumns: ColumnDef<Order>[] = [
    {
        accessorKey: "ordererUsername",
        header: () => <Label>User</Label>,
        cell: ({ row }) => {
            const username = row.getValue("ordererUsername") as string;
            return (
                <div className="flex items-center gap-1 w-min">
                    {username}
                    <DollarSign className="self-start w-3 h-3 text-yellow-400" />
                </div>
            );
        },
    },
    {
        accessorKey: "category",
        header: () => <Label>Category</Label>,
        cell: ({ row }) => {
            const category = row.getValue("category") as ContentCategory;
            const label = contentCategoryLabels.find(
                (cat) => cat.value === category
            )?.label;

            const CategoryIcon = ({ className }: { className?: string }) => {
                if (category === "games") {
                    return <Gamepad className={className} />;
                } else if (category === "video") {
                    return <SiYoutube className={className} />;
                } else if (category === "movies") {
                    return <Clapperboard className={className} />;
                } else if (category === "anime") {
                    return <Squirrel className={className} />;
                } else if (category === "series") {
                    return <MonitorPlay className={className} />;
                }
                return <ListVideo className={className} />;
            };

            return (
                <div className="flex items-center gap-1">
                    <CategoryIcon className="w-4 h-4" />
                    {label}
                </div>
            );
        },
    },
    {
        accessorKey: "message",
        header: () => <Label>Message</Label>,
        cell: ({ row }) => (
            <div className="w-[99%]">{row.getValue("message")}</div>
        ),
    },
    {
        accessorKey: "status",
        header: () => <Label>Status</Label>,
        cell: ({ row }) => {
            const status = row.getValue("status") as OrderStatus;
            const label = orderStatusLabels.find(
                (statusItem) => statusItem.value === status
            )?.label;

            const StatusIcon = ({ className }: { className?: string }) => {
                if (status === "pending") {
                    return <Loader className={className} />;
                } else if (status === "approved") {
                    return <Check className={className} />;
                } else if (status === "rejected") {
                    return <X className={className} />;
                }
                return null;
            };

            return (
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge
                                variant={
                                    status == "rejected"
                                        ? "destructive"
                                        : status == "approved"
                                          ? "default"
                                          : "secondary"
                                }
                                className="w-min h-min"
                            >
                                <StatusIcon className="h-4 w-4" />
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{label}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: () => <Label>Date</Label>,
        cell: ({ row }) => (
            <div>
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

            return (
                <div className="flex items-center text-center">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        disabled={order.status !== "pending"}
                        onClick={() => {
                            openModal(ModalType.RejectOrder, {
                                id: order.id,
                                message: order.message,
                                orderer: order.ordererUsername,
                            });
                        }}
                    >
                        <X />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-green-500"
                        disabled={order.status !== "pending"}
                        onClick={() => {
                            openModal(ModalType.ApproveOrder, { id: order.id });
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
