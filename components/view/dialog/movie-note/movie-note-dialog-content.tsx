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
import { MovieNote, Reaction } from "@/utils/api/types";
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
import { SiThemoviedatabase, SiThemoviedatabaseHex } from "@icons-pack/react-simple-icons";
import { getMovieSourceLinks } from "../movie-note-creator/movie-note-creator-dialog-content";

export default function MovieNoteDialogContent() {
    const { noteId: movieNoteId } = useModalStore((state) => state.modalParams!);
    const [movieNote, setMovieNote] = React.useState<MovieNote>();
    const { profile } = useProfileStore((state) => state);

    const [isLoading, startTransition] = React.useTransition();

    const [reactions, setReactions] = React.useState<Reaction[]>();

    React.useEffect(() => {
        if (!profile?.id) return;

        (async () => {
            try {
                const res = await fetchContentNoteReactions(
                    profile,
                    "movies",
                    movieNoteId
                );
                setReactions(res ?? []);
            } catch (error: any) {
                setReactions([]);
            }
        })();
    }, [movieNoteId]);

    React.useEffect(() => {
        setMovieNote(undefined);
    }, [movieNoteId]);

    React.useEffect(() => {
        if (!profile?.id) return;
        startTransition(async () => {
            try {
                const response = await fetchContentNote<MovieNote>(
                    profile,
                    "movies",
                    movieNoteId
                );
                setMovieNote(response);
            } catch (error: any) {
                toast({
                    title: "Failed to load movie note",
                    description: error.message ?? "An error occurred",
                });
            }
        });
    }, [movieNoteId]);

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>{movieNote?.content.title}</DialogTitle>
                </DialogHeader>
            </div>

            <div className="grid space-y-6">
                <div className="flex items-start space-x-4">
                    <ContentNotePoster
                        posterUrl={movieNote?.content.coverUrl}
                        size="md"
                        loading={isLoading}
                    />
                    <div className="grid min-h-[225px] w-full">
                        <div className="flex flex-col gap-0">
                            <div className="font-bold text-lg line-clamp-3">
                                {movieNote?.content.title}
                            </div>
                            {movieNote?.content.releaseDate && (
                                <div className="text-sm whitespace-nowrap flex items-center gap-1">
                                    <RocketIcon className="size-3" />
                                    {new Date(movieNote?.content.releaseDate).toLocaleDateString(
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
                                        status={movieNote?.status}
                                    />
                                </div>

                                <div className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
                                    <HistoryIcon size={12} />
                                    Watched at
                                </div>
                                <div>
                                    <div className="text-sm w-1/2 py-1 whitespace-nowrap">
                                        {movieNote?.watchedAt
                                            ? new Date(
                                                movieNote?.watchedAt
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
                            {movieNote?.content.sourceUrl && (
                                <Link href={movieNote?.content.sourceUrl} target="_blank">
                                    <SiThemoviedatabase className="size-5" color={SiThemoviedatabaseHex} />
                                </Link>
                            )}
                            {movieNote?.content.websites && getMovieSourceLinks(movieNote.content.websites)}
                        </div>
                    </div>
                </div>


                <ContentNoteDialogRated rating={movieNote?.rate} />

                <ContentNoteDialogReview
                    contentNote={movieNote}
                    category="movies"
                    defaultReactions={reactions}
                />

                <NoteDialogOrdersSection noteId={movieNoteId} category="movies" />
            </div>
        </>
    );
}
