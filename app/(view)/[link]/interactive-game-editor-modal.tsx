"use client";

import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import {
    Check,
    ChevronsUpDown,
    Edit,
    StarIcon,
    Trash,
    Upload,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect } from "react";
import { useOrderModal } from "./order-modal-context";

const gameStatuses = [
    {
        value: "planned",
        label: "Planned",
    },
    {
        value: "playing",
        label: "Playing",
    },
    {
        value: "completed",
        label: "Completed",
    },
];

const InteractiveGameEditorModal = () => {
    const { currentModal, order, openModal, closeModal } = useOrderModal();
    const [open, setOpen] = React.useState(false);
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [value, setValue] = React.useState("");
    const [releaseDate, setReleaseDate] = React.useState<Date>();

    const fileUpload = React.useRef<HTMLInputElement>(null);
    const [image, setImage] = React.useState<File | null>(null);
    const [preview, setPreview] = React.useState<string | null>(null);

    useEffect(() => {
        setValue("planned");
    }, [order?.id]);

    useEffect(() => {
        setOpen(false);
        setDetailsOpen(false);
        setPreview(null);
        setImage(null);
    }, [currentModal]);

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

    if (currentModal !== "interactive-game-editor" || !order) {
        return null;
    }

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

                <div className="space-y-6">
                    <div className="flex space-x-4">
                        {!preview && (
                            <div className="flex items-center justify-center">
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
                            </div>
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
                                            handleFileChange(e.target.files)
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
                        {/* <div className="min-w-[173px] min-h-[208px] rounded-md border flex flex-col items-center justify-center space-y-2">
                            <div className="text-center">Upload poster</div>
                            <Button variant="outline" size="icon">
                                <Upload />
                            </Button>
                        </div> */}

                        <div className="w-full flex flex-col space-y-4">
                            <div className="text-xl">{order.message}</div>
                            <table className="border-separate border-spacing-1">
                                <tbody>
                                    <tr>
                                        <td className="w-1/2">Release date</td>
                                        <td>
                                            <div className="flex items-center space-x-1">
                                                <div>
                                                    {new Date(
                                                        releaseDate ??
                                                            "01/01/1900"
                                                    ).toLocaleDateString()}
                                                </div>
                                                <DateTimePicker
                                                    granularity="day"
                                                    triggerButtonProps={{
                                                        size: "icon",
                                                        variant: "ghost",
                                                        className: "w-6 h-6",
                                                    }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-6 h-6"
                                                    >
                                                        <Edit />
                                                    </Button>
                                                </DateTimePicker>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Status</td>
                                        <td>
                                            <div className="flex items-center space-x-1">
                                                <div>{value}</div>
                                                <Popover
                                                    open={open}
                                                    onOpenChange={setOpen}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-6 h-6"
                                                            role="combobox"
                                                            aria-expanded={open}
                                                        >
                                                            <Edit />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search status..." />
                                                            <CommandList>
                                                                <CommandEmpty>
                                                                    No status
                                                                    found.
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {gameStatuses.map(
                                                                        (
                                                                            status
                                                                        ) => (
                                                                            <CommandItem
                                                                                key={
                                                                                    status.value
                                                                                }
                                                                                value={
                                                                                    status.value
                                                                                }
                                                                                onSelect={(
                                                                                    currentValue
                                                                                ) => {
                                                                                    setValue(
                                                                                        currentValue ===
                                                                                            value
                                                                                            ? ""
                                                                                            : currentValue
                                                                                    );
                                                                                    setOpen(
                                                                                        false
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        value ===
                                                                                            status.value
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {
                                                                                    status.label
                                                                                }
                                                                            </CommandItem>
                                                                        )
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="pt-4">Request date</td>
                                        <td className="pt-4">
                                            {new Date().toLocaleDateString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-md font-semibold">Comment</div>
                        <Textarea placeholder="Type your comment here." />
                    </div>

                    <div className="space-y-2">
                        <div className="text-md font-semibold">Rate</div>
                        <div className="flex items-center mb-4">
                            <div className="flex items-center">
                                {[...Array(10)].map((_, i) => (
                                    <StarIcon
                                        key={i}
                                        className={`w-5 h-5 ${
                                            i < 4
                                                ? "text-yellow-400 fill-current"
                                                : "text-gray-300"
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="ml-2 font-semibold">{4}/10</span>
                        </div>
                    </div>

                    <Collapsible
                        open={detailsOpen}
                        onOpenChange={setDetailsOpen}
                        className="space-y-2"
                    >
                        <div className="flex items-center justify-between space-x-4">
                            <div className="text-md font-semibold">
                                Requesters (5)
                            </div>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="sr-only">Toggle</span>
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex gap-2 items-center space-x-2"
                                >
                                    <span className="text-muted-foreground">
                                        {new Date(
                                            order.createdAt
                                        ).toLocaleDateString()}
                                    </span>
                                    <span>{order.ordererUsername}</span>
                                    <span className="text-muted-foreground">&mdash;</span>
                                    <span>{order.amount}$</span>
                                </div>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                </div>
                <DialogFooter>
                    <Button onClick={() => openModal("deny", order)}>
                        Continue
                    </Button>
                    <Button variant="secondary" onClick={closeModal}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InteractiveGameEditorModal;
