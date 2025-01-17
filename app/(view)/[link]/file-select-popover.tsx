"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PopoverClose } from "@radix-ui/react-popover";
import { cva, VariantProps } from "class-variance-authority";
import { FileIcon, TrashIcon, X } from "lucide-react";
import React from "react";

const fileElementVariants = cva("flex gap-4 border rounded-lg p-3", {
    variants: {
        variant: {
            valid: "bg-green-500/20 border-green-300/10",
            invalid: "bg-destructive/50 border-destructive/50",
            default: "",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

const DeletableFileElement = ({
    className,
    variant = "default",
    fileName,
    fileSize,
    onDelete,
    loading = false,
}: {
    className?: string;
    fileName: string;
    fileSize: string;
    onDelete: () => void;
    loading?: boolean;
} & VariantProps<typeof fileElementVariants>) => {
    return (
        <div className={cn(fileElementVariants({ variant }), className)}>
            <div className="flex gap-4 justify-between w-full">
                <div className="flex gap-2 items-center">
                    <FileIcon size={40} />
                    <div className="flex flex-col gap-1">
                        <Label className="font-semibold truncate max-w-40">
                            {fileName}
                        </Label>
                        <Label className="text-xs text-muted-foreground">
                            {fileSize}
                        </Label>
                    </div>
                </div>
                <Button
                    variant={loading ? "ghost" : "outline"}
                    size="icon"
                    onClick={onDelete}
                    disabled={loading}
                >
                    {loading ? <LoadingSpinner /> : <TrashIcon />}
                </Button>
            </div>
        </div>
    );
};

const TabButton = ({
    selected,
    children,
    ...props
}: React.PropsWithChildren<
    React.ComponentProps<"button"> & {
        selected: boolean;
    }
>) => {
    return (
        <div
            className={cn(
                "relative before:absolute before:bg-muted-foreground/100 before:origin-center before:h-[2px] before:bottom-1 before:w-[0%] after:w-[0%] before:opacity-0 after:opacity-0 before:left-[50%] after:right-[50%] after:absolute after:bg-muted-foreground/100 after:origin-center after:h-[2px] after:bottom-1 before:transition-all after:transition-all",
                selected &&
                    "before:w-[40%] after:w-[40%] before:opacity-100 after:opacity-100"
            )}
        >
            <Button
                variant="ghost"
                className={cn("px-2", !selected && "text-muted-foreground")}
                {...props}
            >
                {children}
            </Button>
        </div>
    );
};

export type ImagePreview = {
    id: string;
    url: string;
};

export type ImageFile = {
    uploadId: string;
    file: File;
    isLoading: boolean;
    preview?: ImagePreview;
    error?: string;
};

type Props = {
    onImageFileSelected: (image: ImageFile) => void;
    onImageFileDeleted: (uploadId: string) => void;
    imageFiles: ImageFile[];
    className?: string;
};

type Tab = "upload" | "embed" | "search";

export default function FileSelectPopover({
    children,
    onImageFileSelected,
    onImageFileDeleted,
    imageFiles,
}: React.PropsWithChildren<Props>) {
    const [tab, setTab] = React.useState<Tab>("upload");

    const handleFileChange = async (fileList: FileList | null) => {
        if (fileList && fileList.length > 0) {
            const imageFile: ImageFile = {
                uploadId: crypto.randomUUID(),
                file: fileList[0],
                isLoading: false,
            };

            onImageFileSelected(imageFile);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-fit grid gap-2 p-2" align="start">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <TabButton
                            selected={tab === "upload"}
                            onClick={() => setTab("upload")}
                        >
                            Upload
                        </TabButton>
                        <TabButton
                            selected={tab === "embed"}
                            onClick={() => setTab("embed")}
                            disabled
                        >
                            Embed link
                        </TabButton>
                        <TabButton
                            selected={tab === "search"}
                            onClick={() => setTab("search")}
                            disabled
                        >
                            Search
                        </TabButton>
                    </div>
                    <PopoverClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </PopoverClose>
                </div>
                <div className="inline-flex flex-col gap-3">
                    <label className="flex flex-col items-center justify-center m-2 border-2 border-gray-500 hover:dark:border-gray-400 transition-colors border-dashed rounded-lg cursor-pointer">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 gap-1 px-4">
                            <p className="text-sm text-nowrap">
                                Drag & drop your file here or&nbsp;
                                <span className="underline">
                                    click to select
                                </span>
                            </p>
                            <p className="text-xs text-center text-muted-foreground">
                                JPEG, PNG or WEBP
                            </p>
                            <p className="text-xs text-center text-muted-foreground">
                                2/3 ratio recommended
                            </p>
                        </div>
                        <input
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e.target.files)}
                        />
                    </label>
                    <Label className="text-xs text-muted-foreground">
                        The maximum file size is 5 MB
                    </Label>
                    <div className="grid gap-2">
                        {imageFiles.map(
                            ({ file, uploadId, isLoading }, index) => (
                                <DeletableFileElement
                                    key={index}
                                    fileName={file.name}
                                    fileSize={`${(file.size / 1024).toFixed(2)} KB`}
                                    loading={isLoading}
                                    onDelete={() =>
                                        onImageFileDeleted(uploadId)
                                    }
                                />
                            )
                        )}
                    </div>
                    <div className="flex items-center justify-end gap-4">
                        <Button
                            variant="default"
                            disabled={imageFiles.length === 0}
                        >
                            Save
                        </Button>
                        <Button variant="destructive">Cancel</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
