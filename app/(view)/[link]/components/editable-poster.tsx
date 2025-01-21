"use client";

import { uploadPoster } from "@/hooks/api-endpoints-client";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/providers/profile-store";
import { Upload } from "lucide-react";
import Image from "next/image";
import React from "react";
import FileSelectPopover, { ImageFile } from "../file-select-popover";

type Props = {
    value?: string;
    defaultImageUrl?: string;
    onChange: (value: string | undefined) => void;
};

const maxFiles = 3;

const EditablePoster = ({ value, defaultImageUrl, onChange }: Props) => {
    const profile = useProfileStore((state) => state.profile);
    const [imageFiles, setImageFiles] = React.useState<ImageFile[]>([]);

    function updateImageFileById(id: string, update: Partial<ImageFile>) {
        setImageFiles((prevFiles) =>
            prevFiles.map((file) =>
                file.uploadId === id ? { ...file, ...update } : file
            )
        );
    }

    function onImageFileSelected(image: ImageFile) {
        setImageFiles((prevFiles) => {
            const newFiles = [...prevFiles, image];
            return newFiles.slice(-maxFiles);
        });

        (async () => {
            const formData = new FormData();
            formData.append("file", image.file);

            updateImageFileById(image.uploadId, {
                isLoading: true,
            });

            try {
                const res = await uploadPoster(profile, formData, 'md');
                updateImageFileById(image.uploadId, {
                    preview: {
                        id: res?.previewId ?? "",
                        url: res?.previewUrl ?? "",
                    },
                });
            } catch (error: any) {
                updateImageFileById(image.uploadId, {
                    error: error.message ?? "An error occurred",
                });
            }

            updateImageFileById(image.uploadId, {
                isLoading: false,
            });
        })();
    }

    function onImageFileDeleted(uploadId: string) {
        setImageFiles((prevFiles) =>
            prevFiles.filter((file) => file.uploadId !== uploadId)
        );
    }

    const imageFileWithPreview: ImageFile | undefined = React.useMemo(() => {
        const imageFile = imageFiles.filter(
            ({ preview }) => preview && preview.url && preview.id
        );
        return imageFile.length > 0
            ? imageFile[imageFile.length - 1]
            : undefined;
    }, [imageFiles]);

    const imageFile: ImageFile | undefined = React.useMemo(() => {
        return imageFiles.find(({ preview }) => preview?.id === value);
    }, [value]);

    React.useEffect(() => {
        onChange(imageFileWithPreview?.preview?.id);
    }, [imageFileWithPreview?.uploadId]);

    return (
        <div className="relative flex flex-col max-w-[150px] max-h-[225px] min-h-max min-w-max rounded-lg">
            {imageFile?.preview?.url || defaultImageUrl ? (
                <Image
                    src={imageFile?.preview?.url ?? defaultImageUrl ?? ""}
                    alt="Poster preview"
                    width={150}
                    height={225}
                    unoptimized
                />
            ) : (
                <div className="w-[150px] h-[225px]" />
            )}
            <FileSelectPopover
                onImageFileSelected={onImageFileSelected}
                onImageFileDeleted={onImageFileDeleted}
                imageFiles={imageFiles}
            >
                <button
                    type="button"
                    className={cn(
                        "absolute inset-0 w-full h-full flex items-center justify-center transition-opacity hover:opacity-100 duration-500 bg-primary-foreground/70 border border-gray-300 border-dashed rounded-lg",
                        imageFile?.preview?.url ? "opacity-0" : "opacity-100"
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
