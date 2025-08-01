"use client";

import { Button } from "@/components/ui/button";
import ContentNotePoster from "@/components/ui/content-note/content-note-poster";
import {
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormField
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    createContentNote,
    fetchContentById
} from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { gameNoteStatusLabels } from "@/utils/api/constants";
import { CreateMovieNoteReq } from "@/utils/api/request";
import { ContentWebsite, Movie, MovieNote, MovieNoteStatus } from "@/utils/api/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { SiImdb, SiImdbHex, SiThemoviedatabase, SiThemoviedatabaseHex, SiWikipedia, SiWikipediaHex } from "@icons-pack/react-simple-icons";
import {
    Check,
    CheckIcon,
    CircleOff,
    HistoryIcon,
    RocketIcon,
    X
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CommentFormItem from "../content-note-editor/comment-form-item";
import DayPickerFormItem from "../content-note-editor/day-picker-form-item";
import RateFormItem from "../content-note-editor/rate-form-item";
import StatusSelectFormItem from "../content-note-editor/status-select-form-item";
import { NoteDialogOrdersSection } from "../note-dialog-orders-section";
import { MovieNoteCreatorDialogParams } from "./movie-note-creator-dialog";

const formSchema = z.object({
    status: z.custom<MovieNoteStatus>(),
    watchedAt: z.date().optional(),
    comment: z.string().optional(),
    rate: z.number().max(10).min(1).optional(),
    contentId: z.string(),
});

type Props = MovieNoteCreatorDialogParams;

export const getMovieSourceLinks = (websites: ContentWebsite[]) => websites?.map(w => {
    switch (w.type.toLowerCase()) {
        case 'tmdb':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiThemoviedatabase className="size-7" color={SiThemoviedatabaseHex} />
                </Link>
            );
        case 'imdb':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiImdb className="size-7" color={SiImdbHex} />
                </Link>
            );
    }
})

export default function MovieNoteCreatorDialogContent({ movieId }: Props) {
    const closeModal = useModalStore((state) => state.closeModal);
    const profile = useProfileStore((state) => state.profile);

    const [movie, setMovie] = React.useState<Movie>();
    const [isLoading, startTransition] = React.useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: "planned",
            comment: "",
            rate: undefined,
            contentId: movieId,
        },
    });

    React.useEffect(() => {
        if (movie) {
            form.reset({
                status: 'planned',
                watchedAt: undefined,
                comment: "",
                rate: undefined,
                contentId: movieId,
            });
        } else {
            form.reset();
        }
    }, [movie?.id]);

    React.useEffect(() => {
        if (!movieId || !profile?.id) return;
        fetchContentById("movies", movieId, 'lg')
            .then(setMovie)
            .catch((err) => {
                console.error(err);
                toast({
                    title: "Failed to fetch movie",
                    description: "Try again later.",
                });
            });
    }, [movieId, profile?.id]);

    const onSubmit = form.handleSubmit((values) => {
        if (!profile?.id) return;

        startTransition(async () => {
            try {
                await createContentNote<MovieNote, CreateMovieNoteReq>(
                    profile,
                    "movies",
                    values
                );
                toast({
                    title: movie?.title ?? "Untitled movie",
                    description: "The movie note was created.",
                });
                closeModal();
            } catch (error: any) {
                toast({
                    title: "Failed to create movie note",
                    description: error.message ?? "An error occurred.",
                    variant: "destructive",
                });
            }
        });
    });

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>{movie?.title}</DialogTitle>
                </DialogHeader>
            </div>

            <Form {...form}>
                <form onSubmit={onSubmit}>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <ContentNotePoster
                                posterUrl={movie?.coverUrl}
                                size="md"
                                loading={isLoading}
                            />
                            <div className="grid min-h-[225px] w-full">
                                <div className="flex flex-col gap-0">
                                    <div className="font-bold text-lg line-clamp-3">
                                        {movie?.title}
                                    </div>
                                    {movie?.releaseDate && (
                                        <div className="text-sm whitespace-nowrap flex items-center gap-1">
                                            <RocketIcon className="size-3" />
                                            {new Date(movie?.releaseDate).toLocaleDateString(
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
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <StatusSelectFormItem
                                                        field={field}
                                                        options={
                                                            gameNoteStatusLabels
                                                        }
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
                                            <HistoryIcon size={12} />
                                            Watched at
                                        </div>
                                        <div>
                                            <FormField
                                                control={form.control}
                                                name="watchedAt"
                                                render={({ field }) => (
                                                    <DayPickerFormItem
                                                        field={field}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-auto mb-1">
                                    {movie?.sourceUrl && (
                                        <Link href={movie?.sourceUrl} target="_blank">
                                            <SiThemoviedatabase className="size-7" color={SiThemoviedatabaseHex} />
                                        </Link>
                                    )}
                                    {movie?.websites && getMovieSourceLinks(movie.websites)}
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="rate"
                            render={({ field }) => (
                                <RateFormItem field={field} />
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <CommentFormItem field={field} />
                            )}
                        />

                        <div className="space-y-2 hidden">
                            <Label className="text-md font-semibold">
                                Recordings/Highlights
                            </Label>
                            <ScrollArea className="max-w-[29rem] whitespace-nowrap">
                                <div className="flex space-x-2 pb-4">
                                    {Array.from({ length: 10 }).map(
                                        (_, index) => (
                                            <div
                                                key={index}
                                                className="w-[192px] h-[108px] bg-white rounded-sm"
                                            />
                                        )
                                    )}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>

                        {movieId && (
                            <NoteDialogOrdersSection
                                noteId={movieId}
                                category="movies"
                            />
                        )}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="destructive"
                            type="button"
                            onClick={closeModal}
                        >
                            <X />
                            Cancel
                        </Button>
                        {movieId && (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => form.reset()}
                                disabled={isLoading || !form.formState.isDirty}
                            >
                                <CircleOff />
                                Reset
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <LoadingSpinner /> : <Check />}
                            {movieId ? "Confirm" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form >
        </>
    );
}
