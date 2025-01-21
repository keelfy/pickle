"use client";

import GameNoteStatusBadge from "@/app/(view)/[link]/games/game-note-status-badge";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchGameNote, fetchGameNoteOrders, fetchGameNotePoster } from "@/hooks/api-endpoints-client";
import { useToast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import {
    Check,
    ChevronsUpDown,
    History,
    ImageOff,
    Link,
    Rocket,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import GameUrl from "../../../../app/(view)/[link]/components/game-url";
import RatingRow from "../../../../app/(view)/[link]/components/rating-row";

export default function GameNoteDialogContent() {
    const { id: gameNoteId } = useModalStore((state) => state.modalParams!);
    const [gameNote, setGameNote] = React.useState<GameNote>();
    const { profile } = useProfileStore((state) => state);

    const [orders, setOrders] = React.useState<Paginated<Order>>();
    const [ordersPage, setOrdersPage] = React.useState(0);

    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [isLoading, startTransition] = React.useTransition();
    const [areOrdersLoading, startOrdersTransition] = React.useTransition();
    const { toast } = useToast();

    const [posterUrl, setPosterUrl] = React.useState<string>();

    React.useEffect(() => {
        (async () => {
            try {
                const res = await fetchGameNotePoster(profile, gameNoteId, 'md');
                setPosterUrl(res?.url);
            } catch (error: any) {
                console.error(error);
                setPosterUrl(undefined);
            }
        })();
    }, []);

    React.useEffect(() => {
        setDetailsOpen(false);
        setGameNote(undefined);
        setOrders(undefined);
        setOrdersPage(0);
    }, [gameNoteId]);

    React.useEffect(() => {
        startTransition(async () => {
            try {
                const response = await fetchGameNote(profile, gameNoteId);
                setGameNote(response);
            } catch (error: any) {
                toast({
                    title: "Failed to load game note",
                    description: error.message ?? "An error occurred",
                });
            }
        });
    }, [gameNoteId]);

    React.useEffect(() => {
        if (!areOrdersLoading && detailsOpen) {
            startOrdersTransition(async () => {
                try {
                    const response = await fetchGameNoteOrders(profile, gameNoteId, ordersPage.toString(), 5);
                    setOrders(response);
                } catch (error: any) {
                    toast({
                        title: "Failed to load orders",
                        description: error.message ?? "An error occurred",
                    });
                }
            });
        }
    }, [detailsOpen, ordersPage]);

    const getTimeAgoText = (date: Date) => {
        const diff = new Date().getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        if (years > 0) {
            return `${years} year${years > 1 ? "s" : ""} ago`;
        }

        if (months > 0) {
            return `${months} month${months > 1 ? "s" : ""} ago`;
        }

        if (days > 0) {
            return `${days} day${days > 1 ? "s" : ""} ago`;
        }

        if (hours > 0) {
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        }

        if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        }

        return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    };

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>
                        {gameNote?.name}
                    </DialogTitle>
                </DialogHeader>
            </div>

            <div className="grid gap-4">
                <div className="flex items-start gap-4">
                    <div className="max-w-[150px] max-h-[225px] min-w-max min-h-max w-[150%] h-[225px]">
                        {posterUrl ? (
                            <Image
                                src={posterUrl}
                                alt="Poster"
                                width={150}
                                height={225}
                                className="rounded-lg"
                            />
                        ) : (
                            <label className="flex flex-col items-center justify-center bg-gray-500 dark:bg-gray-800 w-full h-full rounded-lg">
                                <ImageOff />
                            </label>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col gap-3 w-full justify-between">
                        <div className="font-bold text-lg">
                            {gameNote?.name}
                        </div>
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="text-sm w-1/2 font-semibold flex items-center gap-2">
                                        <div>
                                            <Rocket size={12} />
                                        </div>
                                        <div className="whitespace-nowrap">
                                            Release date
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm w-1/2 p-1 whitespace-nowrap">
                                            {gameNote?.releaseDate
                                                ? new Date(
                                                    gameNote?.releaseDate
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    }
                                                )
                                                : "N/A"}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm w-1/2 font-semibold flex items-center gap-2">
                                        <Link size={12} />
                                        Link
                                    </td>
                                    <td className="w-1/2 text-sm p-1">
                                        {gameNote?.link ? (
                                            <GameUrl url={gameNote.link} />
                                        ) : (
                                            "N/A"
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm w-1/2 pt-3 font-semibold flex items-center gap-2">
                                        <Check size={12} />
                                        Status
                                    </td>
                                    <td className="w-1/2 text-sm p-1 pt-3">
                                        <GameNoteStatusBadge
                                            status={gameNote?.status}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm w-1/2 font-semibold flex items-center gap-2">
                                        <div>
                                            <History size={12} />
                                        </div>
                                        <div className="whitespace-nowrap">
                                            Last played
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm w-1/2 p-1 whitespace-nowrap">
                                            {gameNote?.lastPlayedAt
                                                ? new Date(
                                                    gameNote?.lastPlayedAt
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    }
                                                )
                                                : "N/A"}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label className="text-md font-semibold">
                        {profile?.username}`s review
                    </Label>
                    <RatingRow value={gameNote?.rate ?? 0} />
                </div>

                <div className="p-4 bg-primary-foreground rounded-lg text-sm">
                    {gameNote?.comment && gameNote.comment.length > 0 ? (
                        gameNote.comment
                    ) : (
                        <span className="text-muted-foreground">
                            keelfy hasn't left a comment yet.
                        </span>
                    )}
                </div>

                <Collapsible
                    open={detailsOpen}
                    onOpenChange={() => setDetailsOpen(!detailsOpen)}
                    className="space-y-2"
                >
                    <div className="flex items-center space-x-4">
                        <Label className="text-md font-semibold">
                            Suggesters
                        </Label>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <ChevronsUpDown className="h-4 w-4" />
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </CollapsibleTrigger>
                        {areOrdersLoading && <LoadingSpinner />}
                    </div>
                    <CollapsibleContent>
                        <div className="flex flex-col gap-3 pl-2 border p-2 rounded-md">
                            <TooltipProvider>
                                <table className="w-fit border-separate border-spacing-y-0.5 border-spacing-x-2">
                                    <tbody>
                                        {orders?.content.map((order) => (
                                            <tr key={order.id}>
                                                <td className="text-muted-foreground">
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            {getTimeAgoText(
                                                                new Date(
                                                                    order.createdAt
                                                                )
                                                            )}
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
                                                {/* {order.amount && (
                                        <>
                                            <span className="text-muted-foreground">
                                                &mdash;
                                            </span>
                                            <span>{order.amount}</span>
                                        </>
                                    )} */}
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
                                                href=""
                                                aria-disabled={ordersPage <= 0}
                                                tabIndex={
                                                    ordersPage <= 0
                                                        ? -1
                                                        : undefined
                                                }
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
                                            <PaginationLink href="#" isActive>
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
            </div>
        </>
    );
}
