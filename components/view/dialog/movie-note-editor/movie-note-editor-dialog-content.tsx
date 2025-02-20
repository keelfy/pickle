"use client";

import EditablePoster from "@/app/(view)/[link]/components/editable-poster";
import { Button } from "@/components/ui/button";
import {
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Form,
    FormField,
    FormItem,
    FormMessage
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { createContentNote, fetchContentNote, updateContentNote } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { movieNoteStatusLabels } from "@/utils/api/constants";
import { MovieNote, MovieNoteStatus } from "@/utils/api/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleOff, X } from "lucide-react";
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
    name: z.string(),
    releaseDate: z.date().optional(),
    status: z.custom<MovieNoteStatus>(),
    watchedAt: z.date().optional(),
    comment: z.string().optional(),
    rate: z.number().max(10).min(1).optional(),
    posterPreviewId: z.string().optional(),
});

type Props = {
    noteId: string | undefined;
}

export default function MovieNoteEditorDialogContent({ noteId }: Props) {
    const closeModal = useModalStore((state) => state.closeModal);
    const profile = useProfileStore((state) => state.profile);

    const [contentNote, setContentNote] = React.useState<MovieNote>();
    const [isLoading, startTransition] = React.useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "Untitled movie",
            status: "planned",
            comment: "",
        },
    });

    React.useEffect(() => {
        if (contentNote) {
            form.reset({
                name: contentNote.name,
                releaseDate: contentNote.releaseDate ? new Date(contentNote.releaseDate) : undefined,
                status: contentNote.status,
                watchedAt: contentNote.watchedAt ? new Date(contentNote.watchedAt) : undefined,
                comment: contentNote.comment,
                rate: contentNote.rate,
            });
        } else {
            form.reset();
        }
    }, [contentNote?.id]);

    React.useEffect(() => {
        if (!noteId || !profile?.id) return;

        fetchContentNote<MovieNote>(profile, "movies", noteId)
            .then(setContentNote)
            .catch(err => {
                console.error(err);
                toast({
                    title: "Failed to fetch movie note",
                    description: "Try again later.",
                });
            });
    }, [noteId, profile?.id]);

    const onSubmit = form.handleSubmit((values) => {
        if (!profile?.id) return;

        if (noteId) {
            startTransition(async () => {
                try {
                    const res = await updateContentNote<MovieNote>(profile, "movies", noteId, values);
                    form.reset(res);
                } catch (error: any) {
                    toast({
                        title: "Failed to update movie",
                        description: error.message ?? "An error occurred.",
                        variant: "destructive",
                    });
                }
            });
        } else {
            startTransition(async () => {
                try {
                    const res = await createContentNote<MovieNote>(profile, "movies", values);
                    toast({
                        title: res.name,
                        description: "The movie was created.",
                    });
                    closeModal();
                } catch (error: any) {
                    toast({
                        title: "Failed to create movie",
                        description: error.message ?? "An error occurred.",
                        variant: "destructive",
                    });
                }
            })
        }
    });

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>
                        {contentNote?.name}
                    </DialogTitle>
                </DialogHeader>
            </div>

            <Form {...form}>
                <form onSubmit={onSubmit}>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <EditablePoster
                                value={form.watch("posterPreviewId")}
                                defaultImageUrl={contentNote?.posterUrl}
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
                                            <td className="w-1/2">
                                                <Label className="text-sm">
                                                    Release Date
                                                </Label>
                                            </td>
                                            <td>
                                                <FormField
                                                    control={form.control}
                                                    name="releaseDate"
                                                    render={({ field }) => <DayPickerFormItem field={field} />}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="pt-4 text-sm">
                                                Status
                                            </td>
                                            <td className="pt-4">
                                                <FormField
                                                    control={form.control}
                                                    name="status"
                                                    render={({ field }) => (
                                                        <StatusSelectFormItem
                                                            field={field}
                                                            options={movieNoteStatusLabels}
                                                        />
                                                    )}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <Label className="text-sm">
                                                    Watched At
                                                </Label>
                                            </td>
                                            <td>
                                                <FormField
                                                    control={form.control}
                                                    name="watchedAt"
                                                    render={({ field }) => <DayPickerFormItem field={field} />}
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
                            render={({ field }) => <RateFormItem field={field} />}
                        />

                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => <CommentFormItem field={field} />}
                        />

                        <div className="space-y-2 hidden">
                            <Label className="text-md font-semibold">
                                Recording/Highlights
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
                        <Button type="submit" disabled={isLoading || !form.formState.isValid || !form.formState.isDirty}>
                            {isLoading ? <LoadingSpinner /> : <Check />}
                            {noteId ? "Confirm" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </>
    );
}
