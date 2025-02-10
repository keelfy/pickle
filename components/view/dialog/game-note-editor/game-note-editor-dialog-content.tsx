"use client";

import EditableDate from "@/app/(view)/[link]/components/editable-date";
import EditablePoster from "@/app/(view)/[link]/components/editable-poster";
import EditableStatusButton from "@/app/(view)/[link]/components/editable-status-button";
import GameUrl from "@/app/(view)/[link]/components/game-url";
import RatingRowInput from "@/app/(view)/[link]/components/rating-row-input";
import ApiTypeCommand from "@/components/ui/api-type-command";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
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
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchGameNote, fetchGameNotePoster, updateGameNote } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { gameNoteStatusLabels } from "@/utils/api/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { PopoverClose } from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, CircleOff, Edit, X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    name: z.string(),
    link: z.string().optional(),
    releaseDate: z.date().optional(),
    status: z.custom<GameNoteStatus>(),
    lastPlayedAt: z.date().optional(),
    comment: z.string().optional(),
    rate: z.number().max(10).min(1).optional(),
    poster: z.object({
        previewId: z.string().optional(),
    }).optional(),
});

export default function GameNoteEditorDialogContent() {
    const { currentModal, closeModal } = useModalStore(
        (state) => state
    );
    const { id: gameNoteId } = useModalStore((state) => state.modalParams!);
    const profile = useProfileStore((state) => state.profile);

    const [gameNote, setGameNote] = React.useState<GameNote>();
    const [posterUrl, setPosterUrl] = React.useState<string>();
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [isLoading, startTransition] = React.useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            status: "planned",
            comment: "",
        },
    });

    React.useEffect(() => {
        if (gameNote) {
            form.reset({
                name: gameNote.name,
                link: gameNote.link,
                releaseDate: gameNote.releaseDate ? new Date(gameNote.releaseDate) : undefined,
                status: gameNote.status,
                lastPlayedAt: gameNote.lastPlayedAt ? new Date(gameNote.lastPlayedAt) : undefined,
                comment: gameNote.comment,
                rate: gameNote.rate,
                poster: gameNote.poster,
            });
        } else {
            form.reset();
        }
    }, [gameNote?.id]);

    React.useEffect(() => {
        setDetailsOpen(false);
    }, [currentModal]);

    React.useEffect(() => {
        if (gameNoteId && profile?.id) {
            fetchGameNote(profile, gameNoteId).then(setGameNote).catch(err => {
                console.error(err);
                toast({
                    title: "Failed to fetch game note",
                    description: "Try again later.",
                });
            });

            fetchGameNotePoster(profile, gameNoteId, 'md')
                .then(res => setPosterUrl(res?.url))
                .catch(err => {
                    console.error(err);
                    setPosterUrl(undefined);
                    toast({
                        title: "Failed to fetch game note poster",
                        description: err.message ?? "Try again later.",
                    });
                });
        }
    }, [gameNoteId, profile?.id]);

    const onSubmit = form.handleSubmit((values) => {
        if (!gameNoteId || !profile?.id) return;

        startTransition(async () => {
            try {
                const res = await updateGameNote(profile, gameNoteId, values);
                form.reset(res);
                toast({
                    title: "Game note updated",
                    description: "The game note was updated.",
                });
                closeModal();
            } catch (error: any) {
                toast({
                    title: "Failed to update game note",
                    description:
                        "Status code: " + error.status + ". Try again later.",
                });
            }
        });
    });

    return (
        <>
            <DialogHeader>
                <DialogTitle>{gameNote?.name}</DialogTitle>
                <DialogDescription>
                    Fill card with detailed info about the game.
                </DialogDescription>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={onSubmit}>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <EditablePoster
                                value={form.watch("poster.previewId")}
                                defaultImageUrl={posterUrl}
                                onChange={(value) => {
                                    form.setValue("poster.previewId", value, {
                                        shouldDirty: true,
                                    });
                                }}
                            />
                            <table className="w-full">
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
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <DateTimePicker
                                                                granularity="day"
                                                                {...field}
                                                                triggerButtonProps={{
                                                                    size: "icon",
                                                                    variant:
                                                                        "ghost",
                                                                    className:
                                                                        "w-full h-8",
                                                                }}
                                                            >
                                                                <EditableDate
                                                                    value={
                                                                        field.value
                                                                    }
                                                                />
                                                            </DateTimePicker>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="w-1/2">
                                            <Label className="text-sm">
                                                Link
                                            </Label>
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
                                        <td className="pt-4">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Label className="text-sm">
                                                            Status
                                                        </Label>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>
                                                            The status of your
                                                            playthrough for this
                                                            game.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </td>
                                        <td className="pt-4">
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Popover>
                                                            <PopoverTrigger
                                                                asChild
                                                            >
                                                                <FormControl>
                                                                    <EditableStatusButton
                                                                        value={gameNoteStatusLabels
                                                                            .filter(
                                                                                (
                                                                                    s
                                                                                ) =>
                                                                                    s.value ==
                                                                                    field.value
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    s
                                                                                ) =>
                                                                                    s.label
                                                                            )
                                                                            .join()}
                                                                        role="combobox"
                                                                    />
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[200px] p-0">
                                                                <ApiTypeCommand
                                                                    entries={
                                                                        gameNoteStatusLabels
                                                                    }
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    onSelect={(
                                                                        selectedValue
                                                                    ) => {
                                                                        form.setValue(
                                                                            "status",
                                                                            selectedValue
                                                                        );
                                                                    }}
                                                                    getLabel={(
                                                                        status
                                                                    ) => (
                                                                        <PopoverClose className="w-full text-start">
                                                                            {
                                                                                status.label
                                                                            }
                                                                        </PopoverClose>
                                                                    )}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </FormItem>
                                                )}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Label className="text-sm">
                                                Last Played
                                            </Label>
                                        </td>
                                        <td>
                                            <FormField
                                                control={form.control}
                                                name="lastPlayedAt"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <DateTimePicker
                                                            locale={{
                                                                code: navigator.language,
                                                            }}
                                                            granularity="day"
                                                            {...field}
                                                            triggerButtonProps={{
                                                                size: "icon",
                                                                variant:
                                                                    "ghost",
                                                                className:
                                                                    "w-full h-8",
                                                            }}
                                                        >
                                                            <EditableDate
                                                                value={
                                                                    field.value
                                                                }
                                                            />
                                                        </DateTimePicker>
                                                    </FormItem>
                                                )}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-4">
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-md font-semibold">
                                            Rate
                                        </FormLabel>
                                        <FormControl>
                                            <RatingRowInput {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-md font-semibold">
                                Comment
                            </Label>
                            <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        placeholder="Type your comment here."
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-md font-semibold">
                                Highlights
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

                        <Collapsible
                            open={detailsOpen}
                            onOpenChange={setDetailsOpen}
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-between space-x-4">
                                <Label className="text-md font-semibold">
                                    Requesters (1)
                                </Label>
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                    >
                                        <ChevronsUpDown className="h-4 w-4" />
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent>
                                <div className="flex gap-2 items-center space-x-2">
                                    <span className="text-muted-foreground">
                                        22 min ago
                                    </span>
                                    <span>{gameNote?.initialOrdererUsername}</span>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
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
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => form.reset()}
                            disabled={isLoading || !form.formState.isDirty}
                        >
                            <CircleOff />
                            Reset
                        </Button>
                        <Button type="submit" disabled={isLoading || !form.formState.isValid || !form.formState.isDirty}>
                            {isLoading ? <LoadingSpinner /> : <Check />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </>
    );
}
