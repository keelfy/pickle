"use client";

import GameNoteStatusBadge from "@/app/(view)/[link]/games/GameNoteStatusBadge";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/providers/auth-store";
import { useNoteStore } from "@/providers/note-store";
import { useProfileStore } from "@/providers/profile-store";
import { fetchApi } from "@/utils/api/client";
import { ChevronsUpDown, ImageOff } from "lucide-react";
import Image from "next/image";
import React from "react";
import GameUrl from "../../../../app/(view)/[link]/components/game-url";
import RatingRow from "../../../../app/(view)/[link]/components/rating-row";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export default function GameNoteDialogContent() {
    const [gameNote, setGameNote] = React.useState<GameNote>();
    const { shortNote } = useNoteStore((state) => state);
    const { profile } = useProfileStore((state) => state);
    const { user } = useAuthStore((state) => state);

    const [orders, setOrders] = React.useState<Paginated<Order>>();

    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [isLoading, startTransition] = React.useTransition();
    const [areOrdersLoading, startOrdersTransition] = React.useTransition();
    const { toast } = useToast();

    const [posterUrl, setPosterUrl] = React.useState<string>();

    React.useEffect(() => {
        (async () => {
            try {
                const res = await fetchApi<any>(
                    `/v1/game-notes/${shortNote!.id}/posters?size=md`,
                    true
                );
                setPosterUrl(res.url);
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
    }, [shortNote?.id]);

    React.useEffect(() => {
        startTransition(async () => {
            try {
                const response = await fetchApi<GameNote>(
                    `/v1/game-notes/${shortNote?.id}`
                );
                setGameNote(response);
            } catch (error: any) {
                toast({
                    title: "Failed to load game note",
                    description: error.message ?? "An error occurred",
                });
            }
        });
    }, [shortNote?.id]);

    const onOrdersExpand = () => {
        if (!detailsOpen && !orders && !areOrdersLoading) {
            startOrdersTransition(async () => {
                try {
                    const response = await fetchApi<Paginated<Order>>(
                        `/v1/game-notes/${shortNote?.id}/orders`
                    );
                    setOrders(response);
                } catch (error: any) {
                    toast({
                        title: "Failed to load orders",
                        description: error.message ?? "An error occurred",
                    });
                }
            });
        }

        setDetailsOpen(!detailsOpen);
    };

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>
                        {shortNote?.name}
                        {isLoading && <LoadingSpinner />}
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
                        <div>
                            <span className="font-bold text-lg">
                                {gameNote?.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                &nbsp;&nbsp;
                                {gameNote?.releaseDate &&
                                    ` ${new Date(
                                        gameNote.releaseDate
                                    ).getFullYear()}`}
                            </span>
                        </div>
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="text-sm w-1/2 font-semibold">
                                        Release date
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
                                    <td className="text-sm w-1/2 font-semibold">
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
                                    <td className="text-sm w-1/2 pt-3 font-semibold">
                                        Status
                                    </td>
                                    <td className="w-1/2 text-sm p-1 pt-3">
                                        <GameNoteStatusBadge
                                            status={gameNote?.status}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm w-1/2 font-semibold">
                                        Last Played
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
                    onOpenChange={onOrdersExpand}
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
                    <CollapsibleContent className="flex flex-col gap-2 pl-2">
                        {orders?.content.map((order) => (
                            <div
                                key={order.id}
                                className="flex gap-2 items-center space-x-2"
                            >
                                <span className="text-muted-foreground">
                                    {new Date(
                                        order.createdAt
                                    ).toLocaleDateString()}
                                </span>
                                <span>{order.ordererUsername}</span>
                                {order.amount && (
                                    <>
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                        <span>{order.amount}</span>
                                    </>
                                )}
                            </div>
                        ))}
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious href="#" />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext href="#" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </>
    );
}
