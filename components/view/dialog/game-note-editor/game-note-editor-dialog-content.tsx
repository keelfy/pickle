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
import IGDBIcon from "@/components/ui/icons/igdb-icon";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    fetchContentNote,
    updateContentNote
} from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { gameNoteStatusLabels } from "@/utils/api/constants";
import { GameNote, GameNoteStatus } from "@/utils/api/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Check,
    CheckIcon,
    CircleOff,
    HistoryIcon,
    RocketIcon,
    X
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CommentFormItem from "../content-note-editor/comment-form-item";
import DayPickerFormItem from "../content-note-editor/day-picker-form-item";
import RateFormItem from "../content-note-editor/rate-form-item";
import StatusSelectFormItem from "../content-note-editor/status-select-form-item";
import { getSourceLinks } from "../game-note-creator/game-note-creator-dialog-content";
import { NoteDialogOrdersSection } from "../note-dialog-orders-section";
import Link from "next/link";
import { CreateGameNoteReq } from "@/utils/api/request";

const formSchema = z.object({
    status: z.custom<GameNoteStatus>(),
    lastPlayedAt: z.date().optional(),
    comment: z.string().optional(),
    rate: z.number().max(10).min(1).optional(),
});

type Props = { noteId: string | undefined };

export default function GameNoteEditorDialogContent({ noteId }: Props) {
    const closeModal = useModalStore((state) => state.closeModal);
    const profile = useProfileStore((state) => state.profile);

    const [gameNote, setGameNote] = React.useState<GameNote>();
    const [isLoading, startTransition] = React.useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: "planned",
            comment: "",
        },
    });

    React.useEffect(() => {
        if (gameNote) {
            form.reset({
                status: gameNote.status,
                lastPlayedAt: gameNote.lastPlayedAt
                    ? new Date(gameNote.lastPlayedAt)
                    : undefined,
                comment: gameNote.comment,
                rate: gameNote.rate,
            });
        } else {
            form.reset();
        }
    }, [gameNote?.id]);

    React.useEffect(() => {
        if (!noteId || !profile?.id) return;
        fetchContentNote<GameNote>(profile, "games", noteId, 'lg')
            .then(setGameNote)
            .catch((err) => {
                console.error(err);
                toast({
                    title: "Failed to fetch game note",
                    description: "Try again later.",
                });
            });
    }, [noteId, profile?.id]);

    const onSubmit = form.handleSubmit((values) => {
        if (!profile?.id || !noteId) return;

        startTransition(async () => {
            try {
                const res = await updateContentNote<GameNote, Partial<CreateGameNoteReq>>(
                    profile,
                    "games",
                    noteId,
                    values
                );
                form.reset(res);
            } catch (error: any) {
                toast({
                    title: "Failed to update game",
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
                    <DialogTitle>{gameNote?.content.title}</DialogTitle>
                </DialogHeader>
            </div>

            <Form {...form}>
                <form onSubmit={onSubmit}>
                    <div className="space-y-6">
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
                                            Last played
                                        </div>
                                        <div>
                                            <FormField
                                                control={form.control}
                                                name="lastPlayedAt"
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
                                    {gameNote?.content.sourceUrl && (
                                        <Link href={gameNote?.content.sourceUrl} target="_blank">
                                            <IGDBIcon className="w-12" />
                                        </Link>
                                    )}
                                    {gameNote?.content.websites && getSourceLinks(gameNote.content.websites)}
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

                        {noteId && (
                            <NoteDialogOrdersSection
                                noteId={noteId}
                                category="games"
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
                        {noteId && (
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
                            disabled={isLoading || !form.formState.isDirty}
                        >
                            {isLoading ? <LoadingSpinner /> : <Check />}
                            {noteId ? "Confirm" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </>
    );
}
