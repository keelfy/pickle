"use client";

import EditablePoster from "@/app/(view)/[link]/components/editable-poster";
import GameUrl from "@/app/(view)/[link]/components/game-url";
import { Button } from "@/components/ui/button";
import {
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    createContentNote,
    fetchContentNote,
    updateContentNote,
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
    Edit,
    HistoryIcon,
    LinkIcon,
    RocketIcon,
    X,
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CommentFormItem from "../content-note-editor/comment-form-item";
import DayPickerFormItem from "../content-note-editor/day-picker-form-item";
import EditableContentName from "../content-note-editor/editable-content-name";
import RateFormItem from "../content-note-editor/rate-form-item";
import StatusSelectFormItem from "../content-note-editor/status-select-form-item";
import { NoteDialogOrdersSection } from "../note-dialog-orders-section";

const formSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Name is required" })
        .max(100, { message: "Name must be less than 100 characters" }),
    link: z.string().optional(),
    releaseDate: z.date().optional(),
    status: z.custom<GameNoteStatus>(),
    lastPlayedAt: z.date().optional(),
    comment: z.string().optional(),
    rate: z.number().max(10).min(1).optional(),
    posterPreviewId: z.string().optional(),
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
            name: "Untitled game",
            status: "planned",
            comment: "",
        },
    });

    React.useEffect(() => {
        if (gameNote) {
            form.reset({
                name: gameNote.name,
                link: gameNote.link,
                releaseDate: gameNote.releaseDate
                    ? new Date(gameNote.releaseDate)
                    : undefined,
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
        fetchContentNote<GameNote>(profile, "games", noteId)
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
        if (!profile?.id) return;

        if (noteId) {
            startTransition(async () => {
                try {
                    const res = await updateContentNote<GameNote>(
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
        } else {
            startTransition(async () => {
                try {
                    const res = await createContentNote<GameNote>(
                        profile,
                        "games",
                        values
                    );
                    toast({
                        title: res.name,
                        description: "The game was created.",
                    });
                    closeModal();
                } catch (error: any) {
                    toast({
                        title: "Failed to create game",
                        description: error.message ?? "An error occurred.",
                        variant: "destructive",
                    });
                }
            });
        }
    });

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>{gameNote?.name}</DialogTitle>
                </DialogHeader>
            </div>

            <Form {...form}>
                <form onSubmit={onSubmit}>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <EditablePoster
                                value={form.watch("posterPreviewId")}
                                defaultImageUrl={gameNote?.posterUrl}
                                onChange={(value) => {
                                    form.setValue("posterPreviewId", value, {
                                        shouldDirty: true,
                                    });
                                }}
                            />
                            <div className="flex-1 flex flex-col gap-2 w-full">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-0">
                                            <EditableContentName
                                                value={field.value}
                                                field={field}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <table>
                                    <tbody>
                                        <tr>
                                            <td className="w-1/2 font-semibold flex items-center gap-2">
                                                <div>
                                                    <RocketIcon size={12} />
                                                </div>
                                                <div className="whitespace-nowrap">
                                                    Release date
                                                </div>
                                            </td>
                                            <td>
                                                <FormField
                                                    control={form.control}
                                                    name="releaseDate"
                                                    render={({ field }) => (
                                                        <DayPickerFormItem
                                                            field={field}
                                                        />
                                                    )}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="w-1/2 font-semibold flex items-center gap-2">
                                                <LinkIcon size={12} />
                                                Link
                                            </td>
                                            <td className="w-1/2">
                                                <FormField
                                                    control={form.control}
                                                    name="link"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <FormControl>
                                                                        <Button
                                                                            variant="ghost"
                                                                            className="w-full h-8 p-1"
                                                                            size="icon"
                                                                        >
                                                                            <div className="w-full flex items-center justify-between space-x-1">
                                                                                <GameUrl
                                                                                    url={
                                                                                        field.value
                                                                                    }
                                                                                />
                                                                                <Edit />
                                                                            </div>
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80 p-0">
                                                                    <Input
                                                                        placeholder="Paste URL here..."
                                                                        {...field}
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        </FormItem>
                                                    )}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="pt-4 text-sm font-semibold flex items-center gap-2">
                                                <div>
                                                    <CheckIcon size={12} />
                                                </div>
                                                <div className="whitespace-nowrap">
                                                    Status
                                                </div>
                                            </td>
                                            <td className="pt-4">
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
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-sm w-1/2 py-1 font-semibold flex items-center gap-2">
                                                <HistoryIcon size={12} />
                                                <div className="whitespace-nowrap">
                                                    Last played
                                                </div>
                                            </td>
                                            <td>
                                                <FormField
                                                    control={form.control}
                                                    name="lastPlayedAt"
                                                    render={({ field }) => (
                                                        <DayPickerFormItem
                                                            field={field}
                                                        />
                                                    )}
                                                />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
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
