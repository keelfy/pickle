"use client";

import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/providers/auth-store";
import { useNoteStore } from "@/providers/note-store";
import { fetchApi } from "@/utils/api/client";
import {
    gameNoteStatusLabels
} from "@/utils/api/constants";
import { ChevronsUpDown, ImageOff } from "lucide-react";
import React from "react";
import GameUrl from "../../../../app/(view)/[link]/components/game-url";
import RatingRow from "../../../../app/(view)/[link]/components/rating-row";

export default function GameNoteDialogContent() {
    const [gameNote, setGameNote] = React.useState<GameNote>();
    const { shortNote } = useNoteStore((state) => state);
    const { user } = useAuthStore((state) => state);

    const [orders, setOrders] = React.useState<Paginated<Order>>();

    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [isLoading, startTransition] = React.useTransition();
    const [areOrdersLoading, startOrdersTransition] = React.useTransition();
    const { toast } = useToast();

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
            <DialogHeader>
                <DialogTitle>
                    {shortNote?.name}
                    {isLoading && <LoadingSpinner />}
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
                <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center justify-center min-w-[173px] min-h-[208px] border-2 rounded-lg bg-gray-5 dark:bg-gray-800">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageOff />
                        </div>
                    </div>
                    <table className="w-full">
                        <tbody>
                            {gameNote?.releaseDate && (
                                <tr>
                                    <td className="w-1/2">
                                        <Label className="text-sm">
                                            Release Date
                                        </Label>
                                    </td>
                                    <td>
                                        <div className="text-sm w-1/2 p-1">
                                            {new Date(
                                                gameNote?.releaseDate
                                            ).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {gameNote?.link && (
                                <tr>
                                    <td className="w-1/2">
                                        <Label className="text-sm">Link</Label>
                                    </td>
                                    <td className="w-1/2">
                                        <GameUrl url={gameNote.link} />
                                    </td>
                                </tr>
                            )}
                            <tr className="pt-4">
                                <td className="w-1/2">
                                    <Label className="text-sm">Status</Label>
                                </td>
                                <td className="w-1/2 text-sm p-1">
                                    {gameNoteStatusLabels
                                        .filter(
                                            (s) => s.value == gameNote?.status
                                        )
                                        .map((s) => s.label)
                                        .join()}
                                </td>
                            </tr>
                            {gameNote?.lastPlayedAt && (
                                <tr>
                                    <td className="w-1/2">
                                        <Label className="text-sm">
                                            Last Played
                                        </Label>
                                    </td>
                                    <td>
                                        <div className="text-sm w-1/2 p-1">
                                            {new Date(
                                                gameNote?.lastPlayedAt
                                            ).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {gameNote?.rate && (
                    <div className="space-y-2">
                        <Label className="text-md font-semibold">Rate</Label>
                        <div className="flex items-center mb-4">
                            <RatingRow value={gameNote?.rate ?? 0} />
                            <span className="ml-2 font-semibold text-lg">
                                {gameNote.rate}/10
                            </span>
                        </div>
                    </div>
                )}

                {gameNote?.comment && gameNote.comment.length > 0 && (
                    <div className="space-y-2">
                        <Label className="text-md font-semibold">Comment</Label>
                        <Textarea
                            placeholder="Type your comment here."
                            defaultValue={gameNote.comment}
                            readOnly
                        />
                    </div>
                )}

                <Collapsible
                    open={detailsOpen}
                    onOpenChange={onOrdersExpand}
                    className="space-y-2"
                >
                    <div className="flex items-center space-x-4">
                        <Label className="text-md font-semibold">
                            Requesters
                        </Label>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <ChevronsUpDown className="h-4 w-4" />
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </CollapsibleTrigger>
                        {areOrdersLoading && <LoadingSpinner />}
                    </div>
                    <CollapsibleContent className="flex flex-col gap-2">
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
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </>
    );
}
