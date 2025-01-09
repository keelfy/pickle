"use client";

import { Upload } from "lucide-react";
import React from "react";
import EditablePosterPreview from "./editable-poster-preview";

type Props = {
    onChange?: (file: File | undefined) => void;
};

const EditablePoster = ({ onChange = () => {} }: Props) => {
    const [preview, setPreview] = React.useState<string>();

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            onChange(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (preview) {
        return (
            <EditablePosterPreview
                preview={preview}
                onFileSelected={handleFileChange}
                onClear={() => {
                    setPreview(undefined);
                    onChange(undefined);
                }}
            />
        );
    }

    return (
        <label className="flex flex-col items-center justify-center min-w-[173px] min-h-[208px] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-5 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span>
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
                onChange={(e) => handleFileChange(e.target.files)}
            />
        </label>
    );
};

export default EditablePoster;
