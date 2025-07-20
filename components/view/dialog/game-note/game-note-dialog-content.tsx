"use client";

import ContentNotePoster from "@/components/ui/content-note/content-note-poster";
import ContentNoteStatusBadge from "@/components/ui/content-note/content-note-status-badge";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import IGDBIcon from "@/components/ui/icons/igdb-icon";
import { NoteDialogOrdersSection } from "@/components/view/dialog/note-dialog-orders-section";
import {
    fetchContentNote,
    fetchContentNoteReactions,
} from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { GameNote, Reaction } from "@/utils/api/types";
import {
    CheckIcon,
    HistoryIcon,
    RocketIcon
} from "lucide-react";
import Link from "next/link";
import React from "react";
import ContentNoteDialogRated from "../content-note/content-note-dialog-rated";
import ContentNoteDialogReview from "../content-note/content-note-dialog-review";
import { getSourceLinks } from "../game-note-creator/game-note-creator-dialog-content";

export default function GameNoteDialogContent() {
    const { noteId: gameNoteId } = useModalStore((state) => state.modalParams!);
    const [gameNote, setGameNote] = React.useState<GameNote>();
    const { profile } = useProfileStore((state) => state);

    const [isLoading, startTransition] = React.useTransition();

    const [reactions, setReactions] = React.useState<Reaction[]>();

    React.useEffect(() => {
        if (!profile?.id) return;

        (async () => {
            try {
                const res = await fetchContentNoteReactions(
                    profile,
                    "games",
                    gameNoteId
                );
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
                const response = await fetchContentNote<GameNote>(
                    profile,
                    "games",
                    gameNoteId
                );
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
                    <DialogTitle>{gameNote?.content.title}</DialogTitle>
                </DialogHeader>
            </div>

            <div className="grid space-y-6">
                <div className="flex items-start space-x-4">
                    <ContentNotePoster
                        posterUrl={gameNote?.content.coverUrl?.replace("t_thumb", "t_cover_big")}
                        size="md"
                        loading={isLoading}
                    />
                    <div className="grid min-h-[225px] w-full">
                        <div className="flex flex-col gap-0">
                            <div className="font-bold text-lg line-clamp-3">
                                {gameNote?.content.title}
                            </div>
                            {gameNote?.content.releaseDate && (
                                <div className="text-sm whitespace-nowrap flex items-center gap-1">
                                    <RocketIcon className="size-3" />
                                    {new Date(gameNote?.content.releaseDate).toLocaleDateString(
                                        undefined,
                                        {
                                            year: "numeric"
                                        }
                                    )}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <div className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
                                    <CheckIcon size={12} />
                                    Status
                                </div>
                                <div>
                                    <ContentNoteStatusBadge
                                        status={gameNote?.status}
                                    />
                                </div>

                                <div className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
                                    <HistoryIcon size={12} />
                                    Last played
                                </div>
                                <div>
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
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-auto mb-1">
                            {gameNote?.content.sourceUrl && (
                                <Link href={gameNote?.content.sourceUrl} target="_blank">
                                    <IGDBIcon className="w-12" />
                                </Link>
                            )}
                            {gameNote?.content.websites && getSourceLinks(gameNote.content.websites)}
                        </div>
                    </div>
                </div>


                <ContentNoteDialogRated rating={gameNote?.rate} />

                <ContentNoteDialogReview
                    contentNote={gameNote}
                    category="games"
                    defaultReactions={reactions}
                />

                <NoteDialogOrdersSection noteId={gameNoteId} category="games" />
            </div>
        </>
    );
}
