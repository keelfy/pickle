"use client";

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
import StatusCommand from "./components/status-command";
import { useOrderModal } from "./order-modal-context";

const gameStatuses = [
    {
        value: "planned",
        label: "Planned",
    },
    {
        value: "in_progress",
        label: "Playing",
    },
    {
        value: "played",
        label: "Played",
    },
    {
        value: "skipped",
        label: "Skipped",
    },
    {
        value: "awaits_auction",
        label: "Awaits auction",
    },
    {
        value: "review",
        label: "On review",
    },
];

const completionStatuses = [
    {
        value: "completed",
        label: "Finished",
    },
    {
        value: "not_completed",
        label: "Not Finished",
    },
    {
        value: "endless",
        label: "Endless",
    },
];

const formSchema = z.object({
    orderId: z.number().optional(),
    gameStatus: z.string(),
    releaseDate: z.date().optional(),
    completionDate: z.date().optional(),
    completionStatus: z.string(),
    comment: z.string().optional(),
    rate: z.number().max(10).min(1).optional(),
    highlights: z.array(z.string()).optional(),
    gameLink: z.string().optional(),
    posterFile: z.instanceof(File).optional(),
});

const InteractiveGameEditorModal = () => {
    const { currentModal, order, openModal, closeModal } = useOrderModal();
    const [detailsOpen, setDetailsOpen] = React.useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gameStatus: "review",
            completionStatus: "not_completed",
        },
    });

    useEffect(() => {
        form.reset();
        form.setValue("orderId", order?.id);
    }, [order?.id]);

    useEffect(() => {
        setDetailsOpen(false);
    }, [currentModal]);

    if (currentModal !== "interactive-game-editor" || !order) {
        return null;
    }

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log(values);
        // openModal("deny", order);
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
                                                    name="gameLink"
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
                                                    name="gameStatus"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <FormControl>
                                                                        <EditableStatusButton
                                                                            value={gameStatuses
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
                                                                    <StatusCommand
                                                                        statuses={
                                                                            gameStatuses
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                        onChange={(
                                                                            value
                                                                        ) => {
                                                                            form.setValue(
                                                                                "gameStatus",
                                                                                value
                                                                            );
                                                                            form.setFocus(
                                                                                "gameStatus"
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
                                                    name="completionStatus"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <FormControl>
                                                                        <EditableStatusButton
                                                                            value={completionStatuses
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
                                                                    <StatusCommand
                                                                        statuses={
                                                                            completionStatuses
                                                                        }
                                                                        value={
                                                                            field.value
                                                                        }
                                                                        onChange={(
                                                                            value
                                                                        ) => {
                                                                            form.setValue(
                                                                                "completionStatus",
                                                                                value
                                                                            );
                                                                            form.setFocus(
                                                                                "completionStatus"
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
                                                    name="completionDate"
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
                                        name="rate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <RatingRow {...field} />
                                            </FormItem>
                                        )}
                                    />
                                    <span className="ml-2 font-semibold text-lg">
                                        {form.watch("rate") ? (
                                            form.watch("rate")!!
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
                            <Button type="submit">Continue</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default InteractiveGameEditorModal;
