"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchContentNoteOrders } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { getTimeAgoText } from "@/lib/localize-types";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/providers/profile-store";
import { Paginated } from "@/utils/api/response";
import { ContentCategory, Order } from "@/utils/api/types";
import { ChevronLeftIcon, UserPlusIcon } from "lucide-react";
import React from "react";

type Props = {
    noteId: string;
    category: ContentCategory;
    className?: string;
}

export const NoteDialogOrdersSection = ({ noteId, category, className }: Props) => {
    const { profile } = useProfileStore((state) => state);
    const [detailsOpen, setDetailsOpen] = React.useState(false);

    const [orders, setOrders] = React.useState<Paginated<Order>>();
    const [ordersPage, setOrdersPage] = React.useState(0);
    const [areOrdersLoading, startOrdersTransition] = React.useTransition();

    React.useEffect(() => {
        if (!areOrdersLoading && detailsOpen && !orders) {
            startOrdersTransition(async () => {
                try {
                    const response = await fetchContentNoteOrders(profile, category, noteId, ordersPage, 5);
                    setOrders(response);
                } catch (error: any) {
                    toast({
                        title: "Failed to load suggesters",
                        description: error.message ?? "An error occurred",
                    });
                }
            });
        }
    }, [detailsOpen, ordersPage]);

    React.useEffect(() => {
        setDetailsOpen(false);
        setOrders(undefined);
        setOrdersPage(0);
    }, [noteId]);

    return (
        <Collapsible
            open={detailsOpen}
            onOpenChange={() => setDetailsOpen(!detailsOpen)}
            className={cn("space-y-2", className)}
        >
            <div className="flex items-center justify-between space-x-4">
                <CollapsibleTrigger asChild>
                    <Button variant="link" size="sm" className="text-md font-semibold p-0">
                        <UserPlusIcon className="w-4 h-4" />
                        Suggesters
                    </Button>
                </CollapsibleTrigger>
                {areOrdersLoading && <LoadingSpinner />}
                <Separator orientation="horizontal" className="flex-1" />
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <ChevronLeftIcon className={cn("h-4 w-4 transition-transform duration-300", detailsOpen && "-rotate-90")} />
                        <span className="sr-only">Toggle suggesters view</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <div className="flex flex-col gap-3 px-2">
                    <TooltipProvider>
                        <table className="w-fit border-separate border-spacing-y-0.5 border-spacing-x-2">
                            <tbody>
                                {orders?.content.map((order) => (
                                    <tr key={order.id}>
                                        <td className="text-muted-foreground">
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <p>
                                                        {getTimeAgoText(
                                                            new Date(
                                                                order.createdAt
                                                            )
                                                        )} ago
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleString(
                                                        undefined,
                                                        {
                                                            year: "numeric",
                                                            month: "numeric",
                                                            day: "numeric",
                                                            hour: "numeric",
                                                            minute: "numeric",
                                                        }
                                                    )}
                                                </TooltipContent>
                                            </Tooltip>
                                        </td>
                                        <td>{order.ordererUsername}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TooltipProvider>
                    {orders && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        aria-disabled={ordersPage <= 0}
                                        tabIndex={
                                            ordersPage <= 0
                                                ? -1
                                                : undefined
                                        }
                                        size='sm'
                                        className={
                                            ordersPage <= 0
                                                ? "pointer-events-none opacity-50"
                                                : undefined
                                        }
                                        onClick={() =>
                                            setOrdersPage(
                                                ordersPage - 1
                                            )
                                        }
                                    />
                                </PaginationItem>
                                <PaginationItem
                                    className={
                                        ordersPage === 0
                                            ? "invisible"
                                            : ""
                                    }
                                >
                                    <PaginationLink
                                        href="#"
                                        size='sm'
                                        onClick={() =>
                                            setOrdersPage(
                                                ordersPage - 1
                                            )
                                        }
                                    >
                                        {ordersPage}
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#" size='sm' isActive>
                                        {ordersPage + 1}
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem
                                    className={
                                        ordersPage ===
                                            orders.totalPages - 1
                                            ? "invisible"
                                            : ""
                                    }
                                >
                                    <PaginationLink
                                        href="#"
                                        size='sm'
                                        onClick={() =>
                                            setOrdersPage(
                                                ordersPage + 1
                                            )
                                        }
                                    >
                                        {ordersPage + 2}
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        aria-disabled={
                                            ordersPage ===
                                            orders.totalPages - 1
                                        }
                                        tabIndex={
                                            ordersPage ===
                                                orders.totalPages - 1
                                                ? -1
                                                : undefined
                                        }
                                        size='sm'
                                        className={
                                            ordersPage ===
                                                orders.totalPages - 1
                                                ? "pointer-events-none opacity-50"
                                                : undefined
                                        }
                                        onClick={() =>
                                            setOrdersPage(
                                                ordersPage + 1
                                            )
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
