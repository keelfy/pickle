"use client";

import ContentNotePoster from "@/components/ui/content-note/content-note-poster";
import ContentNoteStatusBadge from "@/components/ui/content-note/content-note-status-badge";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NoteDialogOrdersSection } from "@/components/view/dialog/note-dialog-orders-section";
import { fetchContentNote, fetchContentNoteReactions } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { MovieNote, Reaction } from "@/utils/api/types";
import {
    Check,
    History,
    Rocket
} from "lucide-react";
import React from "react";
import ContentNoteDialogRated from "../content-note/content-note-dialog-rated";
import ContentNoteDialogReview from "../content-note/content-note-dialog-review";

export default function MovieNoteDialogContent() {
    const { id: noteId } = useModalStore((state) => state.modalParams!);
    const [contentNote, setContentNote] = React.useState<MovieNote>();
    const { profile } = useProfileStore((state) => state);

    const [isLoading, startTransition] = React.useTransition();
    const [reactions, setReactions] = React.useState<Reaction[]>();

    React.useEffect(() => {
        if (!profile?.id) return;

        (async () => {
            try {
                const res = await fetchContentNoteReactions(profile, "movies", noteId);
                setReactions(res ?? []);
            } catch (error: any) {
                setReactions([]);
            }
        })();
    }, [noteId]);

    React.useEffect(() => {
        if (!profile?.id) return;
        startTransition(async () => {
            try {
                const response = await fetchContentNote<MovieNote>(profile, "movies", noteId);
                setContentNote(response);
            } catch (error: any) {
                toast({
                    title: "Failed to load movie",
                    description: error.message ?? "An error occurred",
                });
            }
        });
    }, [noteId]);

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>
                        {contentNote?.name}
                    </DialogTitle>
                </DialogHeader>
            </div>

            <div className="grid space-y-6">
                <div className="flex items-start gap-4">
                    <ContentNotePoster posterUrl={contentNote?.posterUrl} size="md" loading={isLoading} />
                    <div className="flex-1 flex flex-col gap-3 w-full justify-between">
                        <div className="font-bold text-lg">
                            {contentNote?.name}
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
                                            {contentNote?.releaseDate
                                                ? new Date(
                                                    contentNote?.releaseDate
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
                                    <td className="text-sm w-1/2 pb-1 pt-3 font-semibold flex items-center gap-2">
                                        <Check size={12} />
                                        Status
                                    </td>
                                    <td className="w-1/2 text-sm pb-1 pt-3">
                                        <ContentNoteStatusBadge
                                            status={contentNote?.status}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm w-1/2 py-1 font-semibold flex items-center gap-2">
                                        <div>
                                            <History size={12} />
                                        </div>
                                        <div className="whitespace-nowrap">
                                            Watched at
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm w-1/2 py-1 whitespace-nowrap">
                                            {contentNote?.watchedAt
                                                ? new Date(
                                                    contentNote?.watchedAt
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

                <ContentNoteDialogRated
                    rating={contentNote?.rate}
                />

                <ContentNoteDialogReview
                    contentNote={contentNote}
                    category="movies"
                    defaultReactions={reactions}
                />

                <NoteDialogOrdersSection
                    noteId={noteId}
                    category="movies"
                />
            </div>
        </>
    );
}
