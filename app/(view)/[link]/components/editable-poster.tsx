"use client";

import {
    deletePosterPreview,
    uploadPosterPreview,
} from "@/hooks/api-endpoints-client";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/providers/profile-store";
import { Upload } from "lucide-react";
import Image from "next/image";
import React from "react";
import FileSelectPopover from "../file-select-popover";
import { ImagePreview } from "@/utils/api/types";

type Props = {
    value?: string;
    defaultImageUrl?: string;
    onChange: (value: string | undefined) => void;
};

const EditablePoster = ({ value, defaultImageUrl, onChange }: Props) => {
    const profile = useProfileStore((state) => state.profile);
    const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(
        defaultImageUrl
    );

    async function uploadImage(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        return uploadPosterPreview(profile, formData, "md");
    }

    async function deleteImage(id: string) {
        deletePosterPreview(profile, id);
    }

    async function embedImage(url: string) {
        const formData = new FormData();
        formData.append("url", url);
        return uploadPosterPreview(profile, formData, "md");
    }

    function onImagePreviewChanged(preview: ImagePreview | undefined) {
        setPreviewUrl(preview?.previewUrl ?? defaultImageUrl);
        onChange(preview?.previewId);
    }

    React.useEffect(() => {
        setPreviewUrl(defaultImageUrl);
    }, [defaultImageUrl]);

    return (
        <div className="relative flex flex-col max-w-[150px] max-h-[225px] min-h-max min-w-max">
            {previewUrl ? (
                <Image
                    src={previewUrl ?? ""}
                    alt="Poster preview"
                    width={150}
                    height={225}
                    className="rounded-lg"
                />
            ) : (
                <div className="w-[150px] h-[225px] rounded-lg" />
            )}
            <FileSelectPopover
                selectedPreviewId={value}
                onImagePreviewChanged={onImagePreviewChanged}
                uploadImage={uploadImage}
                deleteImage={deleteImage}
                embedImage={embedImage}
            >
                <button
                    type="button"
                    className={cn(
                        "absolute inset-0 w-full h-full flex items-center justify-center transition-opacity hover:opacity-100 duration-500 bg-primary-foreground/70 border border-gray-300 border-dashed rounded-lg",
                        previewUrl ? "opacity-0" : "opacity-100"
                    )}
                >
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg px-2 py-4">
                        <Upload className="w-8 h-8" />
                        <p className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                            Click to upload
                        </p>
                    </div>
                </button>
            </FileSelectPopover>
        </div>
    );
};

export default EditablePoster;
