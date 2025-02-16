"use client";

import GameNoteReactions from "@/app/(view)/[link]/games/game-note-reactions";
import GameNoteStatusBadge from "@/app/(view)/[link]/games/game-note-status-badge";
import NoteComment from "@/app/(view)/[link]/games/note-comment";
import ContentPoster from "@/components/ui/content-poster";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { fetchGameNote, fetchGameNoteOrders, fetchGameNotePoster, fetchGameNoteReactions } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { GameNote, Reaction } from "@/utils/api/types";
import {
    Check,
    HeartIcon,
    History,
    Link,
    MessageCircleIcon,
    Rocket
} from "lucide-react";
import React from "react";
import GameUrl from "../../../../app/(view)/[link]/components/game-url";
import RatingRow from "../../../../app/(view)/[link]/components/rating-row";
import { NoteDialogOrdersSection } from "../note-dialog-orders-section";

export default function GameNoteDialogContent() {
    const { id: gameNoteId } = useModalStore((state) => state.modalParams!);
    const [gameNote, setGameNote] = React.useState<GameNote>();
    const { profile } = useProfileStore((state) => state);

    const [isLoading, startTransition] = React.useTransition();
    const [isPosterLoading, startPosterTransition] = React.useTransition();

    const [posterUrl, setPosterUrl] = React.useState<string>();

    const [reactions, setReactions] = React.useState<Reaction[]>();

    React.useEffect(() => {
        if (!profile?.id) return;

        startPosterTransition(async () => {
            try {
                const res = await fetchGameNotePoster(profile, gameNoteId, 'md');
                setPosterUrl(res?.url);
            } catch (error: any) {
                console.error(error);
                setPosterUrl(undefined);
            }
        });
    }, []);

    React.useEffect(() => {
        if (!profile?.id) return;

        (async () => {
            try {
                const res = await fetchGameNoteReactions(profile, gameNoteId);
                setReactions(res ?? []);
            } catch (error: any) {
                setReactions([]);
            }
        })();
    }, [gameNoteId]);

    React.useEffect(() => {
        setGameNote(undefined);
    }, [gameNoteId]);

    React.useEffect(() => {
        if (!profile?.id) return;
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

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>
                        {gameNote?.name}
                    </DialogTitle>
                </DialogHeader>
            </div>

            <div className="grid space-y-6">
                <div className="flex items-start gap-4">
                    <ContentPoster posterUrl={posterUrl} size="md" loading={isPosterLoading} />
                    <div className="flex-1 flex flex-col gap-3 w-full justify-between">
                        <div className="font-bold text-lg">
                            {gameNote?.name}
                        </div>
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="text-sm w-1/2 py-1 font-semibold flex items-center gap-2 align-top">
                                        <div>
                                            <Rocket size={12} />
                                        </div>
                                        <div className="whitespace-nowrap">
                                            Release date
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm w-1/2 py-1 whitespace-nowrap">
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
                                    <td className="text-sm w-1/2 py-1 font-semibold flex items-center gap-2">
                                        <Link size={12} />
                                        Link
                                    </td>
                                    <td className="w-1/2 text-sm py-1">
                                        {gameNote?.link ? (
                                            <GameUrl url={gameNote.link} />
                                        ) : (
                                            "N/A"
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm w-1/2 pb-1 pt-3 font-semibold flex items-center gap-2">
                                        <Check size={12} />
                                        Status
                                    </td>
                                    <td className="w-1/2 text-sm pb-1 pt-3">
                                        <GameNoteStatusBadge
                                            status={gameNote?.status}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm w-1/2 py-1 font-semibold flex items-center gap-2">
                                        <div>
                                            <History size={12} />
                                        </div>
                                        <div className="whitespace-nowrap">
                                            Last played
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm w-1/2 py-1 whitespace-nowrap">
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

                <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                        <HeartIcon className="w-4 h-4" />
                        <Label className="text-md font-semibold">
                            Rated
                        </Label>
                    </div>
                    <RatingRow value={gameNote?.rate ?? 0} />
                </div>

                <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                        <MessageCircleIcon className="w-4 h-4" />
                        <Label className="text-md font-semibold">
                            Review
                        </Label>
                    </div>
                    <NoteComment comment={gameNote?.comment} className="rounded-lg" lengthLimit={180} />
                    {gameNote && reactions && (
                        <GameNoteReactions note={gameNote} defaultReactions={reactions} className="mt-2" />
                    )}
                </div>

                <NoteDialogOrdersSection
                    noteId={gameNoteId}
                    fetchOrders={fetchGameNoteOrders}
                />
            </div>
        </>
    );
}
