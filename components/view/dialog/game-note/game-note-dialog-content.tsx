"use client";

import GameUrl from "@/app/(view)/[link]/components/game-url";
import ContentNotePoster from "@/components/ui/content-note/content-note-poster";
import ContentNoteStatusBadge from "@/components/ui/content-note/content-note-status-badge";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    Check,
    History,
    Link,
    Rocket
} from "lucide-react";
import React from "react";
import ContentNoteDialogRated from "../content-note/content-note-dialog-rated";
import ContentNoteDialogReview from "../content-note/content-note-dialog-review";

export default function GameNoteDialogContent() {
    const { id: gameNoteId } = useModalStore((state) => state.modalParams!);
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
                    <DialogTitle>{gameNote?.name}</DialogTitle>
                </DialogHeader>
            </div>

            <div className="grid space-y-6">
                <div className="flex items-start gap-4">
                    <ContentNotePoster
                        posterUrl={gameNote?.posterUrl}
                        size="md"
                        loading={isLoading}
                    />
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
                                        <ContentNoteStatusBadge
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
