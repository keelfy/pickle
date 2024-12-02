"use client";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/utils/cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { PopoverClose } from "@radix-ui/react-popover";
import { ChevronsUpDown, Edit, Trash, Upload } from "lucide-react";
import Image from "next/image";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import EditableDate from "./components/editable-date";
import EditableStatusButton from "./components/editable-status-button";
import GameLink from "./components/game-link";
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
});

const InteractiveGameEditorModal = () => {
    const { currentModal, order, openModal, closeModal } = useOrderModal();
    const [detailsOpen, setDetailsOpen] = React.useState(false);

    const fileUpload = React.useRef<HTMLInputElement>(null);
    const [image, setImage] = React.useState<File | null>(null);
    const [preview, setPreview] = React.useState<string | null>(null);

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
        form.setValue(
            "gameLink",
            "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/"
        );
    }, [order?.id]);

    useEffect(() => {
        setDetailsOpen(false);
        setPreview(null);
        setImage(null);
    }, [currentModal]);

    if (currentModal !== "interactive-game-editor" || !order) {
        return null;
    }

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log(values);
        // openModal("deny", order);
    };

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            setImage(file);

            // Generate preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Dialog
            open={currentModal === "interactive-game-editor"}
            onOpenChange={closeModal}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add game info</DialogTitle>
                    <DialogDescription>
                        Fill the card of the game
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                {!preview && (
                                    <label className="flex flex-col items-center justify-center min-w-[173px] min-h-[208px] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-5 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4" />
                                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-semibold">
                                                    Click to upload
                                                </span>
                                                <br />
                                                or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                SVG, PNG, JPG or GIF
                                                <br />
                                                (MAX. 800x400px)
                                            </p>
                                        </div>
                                        <input
                                            id="dropzone-file"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleFileChange(e.target.files)
                                            }
                                        />
                                    </label>
                                )}

                                {preview && (
                                    <div className="relative flex flex-col">
                                        <Image
                                            src={preview}
                                            alt="Poster preview"
                                            className="rounded-lg min-w-[173px] min-h-[208px]"
                                            width={173}
                                            height={208}
                                        />
                                        <div className="absolute inset-0 flex items-end justify-between p-2">
                                            <Button
                                                className="top-2 left-2"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    setPreview(null);
                                                    setImage(null);
                                                }}
                                            >
                                                <Trash />
                                            </Button>
                                            <input
                                                id="dropzone-file"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    handleFileChange(
                                                        e.target.files
                                                    )
                                                }
                                                ref={fileUpload}
                                            />
                                            <Button
                                                className="top-2 right-2"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() =>
                                                    fileUpload.current?.click()
                                                }
                                            >
                                                <Upload />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="w-full flex flex-col space-y-2">
                                    <div className="text-xl">
                                        {order.message}
                                    </div>
                                    <table className="border-separate border-spacing-1">
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
                                                                                "w-full h-6",
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
                                                    <div className="flex justify-between items-center">
                                                        <GameLink
                                                            url={form.watch(
                                                                "gameLink"
                                                            )}
                                                            className={cn(
                                                                buttonVariants({
                                                                    variant:
                                                                        "ghost",
                                                                }),
                                                                "flex-1 h-6 p-1"
                                                            )}
                                                        />
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="gameLink"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <Popover>
                                                                        <PopoverTrigger
                                                                            asChild
                                                                        >
                                                                            <FormControl>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    className="w-6 h-6"
                                                                                    size="icon"
                                                                                >
                                                                                    <Edit />
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
                                                    </div>
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
                                                                    The status
                                                                    of your
                                                                    playthrough
                                                                    for this
                                                                    game.
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
                                                                            "w-full h-6",
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
                                        Requesters (5)
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
                                    {Array.from({ length: 5 }).map(
                                        (_, index) => (
                                            <div
                                                key={index}
                                                className="flex gap-2 items-center space-x-2"
                                            >
                                                <span className="text-muted-foreground">
                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    {order.ordererUsername}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    &mdash;
                                                </span>
                                                <span>{order.amount}$</span>
                                            </div>
                                        )
                                    )}
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
