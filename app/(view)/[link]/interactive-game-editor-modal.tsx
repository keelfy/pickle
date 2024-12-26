"use client";

import ApiTypeCommand from "@/components/ui/api-type-command";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    gameNoteCompletionStatuses,
    gameNoteStatuses,
} from "@/utils/api/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { PopoverClose } from "@radix-ui/react-popover";
import { ChevronsUpDown, Edit } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import EditableDate from "./components/editable-date";
import EditablePoster from "./components/editable-poster";
import EditableStatusButton from "./components/editable-status-button";
import GameUrl from "./components/game-url";
import RatingRow from "./components/rating-row";
import { useOrderModal } from "./order-modal-context";
import { fetchWithAuth } from "@/utils/api/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/loading-spinner";

const formSchema = z.object({
    gameNote: z.object({
        name: z.string(),
        link: z.string().optional(),
        releaseDate: z.date().optional(),
        status: z.number(),
        completionStatus: z.number(),
        completionDate: z.date().optional(),
        comment: z.string().optional(),
        rate: z.number().max(10).min(1).optional(),
        // highlights: z.array(z.string()).optional(),
    }),
    initialOrderId: z.string().optional(),
    posterFile: z.instanceof(File).optional(),
});

const InteractiveGameEditorModal = () => {
    const { currentModal, order, openModal, closeModal } = useOrderModal();
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [isLoading, startTransition] = React.useTransition();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gameNote: {
                name: "",
                status: 2, // planned
                completionStatus: 1, // unfinished
                comment: "",
            },
        },
    });

    React.useEffect(() => {
        form.reset();
        form.setValue("initialOrderId", order?.id);
    }, [order?.id]);

    React.useEffect(() => {
        if (order) {
            form.setValue("gameNote.name", order.message);
        }
    }, [order?.message]);

    useEffect(() => {
        setDetailsOpen(false);
    }, [currentModal]);

    if (currentModal !== "interactive-game-editor" || !order) {
        return null;
    }

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        startTransition(async () => {
            try {
                await fetchWithAuth(`/v1/game-notes`, {
                    method: "POST",
                    body: JSON.stringify(values),
                });
            } catch (error: any) {
                console.error(error);
                toast({
                    title: "Failed to approve order",
                    description:
                        "Status code: " + error.status + ". Try again later.",
                });
                return;
            }

            toast({
                title: "Order approved",
                description: "The game was added to your list.",
            });
            closeModal();
        });
    };

    return (
        <Dialog
            open={currentModal === "interactive-game-editor"}
            onOpenChange={closeModal}
        >
            <DialogContent className="overflow-y-scroll max-h-screen">
                <DialogHeader>
                    <DialogTitle>{order.message}</DialogTitle>
                    <DialogDescription>
                        Fill card with detailed info about the game.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <EditablePoster
                                    onChange={(value) =>
                                        form.setValue("posterFile", value)
                                    }
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
                                                    name="gameNote.releaseDate"
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
                                                    name="gameNote.link"
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
                                                                The status of
                                                                your playthrough
                                                                for this game.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </td>
                                            <td className="pt-4">
                                                <FormField
                                                    control={form.control}
                                                    name="gameNote.status"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <FormControl>
                                                                        <EditableStatusButton
                                                                            value={gameNoteStatuses
                                                                                .filter(
                                                                                    (
                                                                                        s
                                                                                    ) =>
                                                                                        s.idx ==
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
                                                                            gameNoteStatuses
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                        onSelect={(
                                                                            selectedValue
                                                                        ) => {
                                                                            form.setValue(
                                                                                "gameNote.status",
                                                                                selectedValue
                                                                            );
                                                                            form.setFocus(
                                                                                "gameNote.status"
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
                                                    Completion Status
                                                </Label>
                                            </td>
                                            <td>
                                                <FormField
                                                    control={form.control}
                                                    name="gameNote.completionStatus"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <FormControl>
                                                                        <EditableStatusButton
                                                                            value={gameNoteCompletionStatuses
                                                                                .filter(
                                                                                    (
                                                                                        s
                                                                                    ) =>
                                                                                        s.idx ==
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
                                                                            gameNoteCompletionStatuses
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                        onSelect={(
                                                                            selectedValue
                                                                        ) => {
                                                                            form.setValue(
                                                                                "gameNote.completionStatus",
                                                                                selectedValue
                                                                            );
                                                                            form.setFocus(
                                                                                "gameNote.completionStatus"
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
                                                    Completion Date
                                                </Label>
                                            </td>
                                            <td>
                                                <FormField
                                                    control={form.control}
                                                    name="gameNote.completionDate"
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

                            <div className="space-y-2">
                                <Label className="text-md font-semibold">
                                    Rate
                                </Label>
                                <div className="flex items-center mb-4">
                                    <FormField
                                        control={form.control}
                                        name="gameNote.rate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <RatingRow {...field} />
                                            </FormItem>
                                        )}
                                    />
                                    <span className="ml-2 font-semibold text-lg">
                                        {form.watch("gameNote.rate") ? (
                                            form.watch("gameNote.rate")!!
                                        ) : (
                                            <>&mdash;</>
                                        )}
                                        /10
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-md font-semibold">
                                    Comment
                                </Label>
                                <FormField
                                    control={form.control}
                                    name="gameNote.comment"
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
                                        <Button variant="ghost" size="sm">
                                            <ChevronsUpDown className="h-4 w-4" />
                                            <span className="sr-only">
                                                Toggle
                                            </span>
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent>
                                    <div className="flex gap-2 items-center space-x-2">
                                        <span className="text-muted-foreground">
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleDateString()}
                                        </span>
                                        <span>{order.ordererUsername}</span>
                                        <span className="text-muted-foreground">
                                            &mdash;
                                        </span>
                                        <span>{order.amount}</span>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button
                                variant="secondary"
                                onClick={() => openModal("approve", order)}
                            >
                                Back
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                <span>Continue</span>
                                {isLoading && <LoadingSpinner />}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default InteractiveGameEditorModal;
