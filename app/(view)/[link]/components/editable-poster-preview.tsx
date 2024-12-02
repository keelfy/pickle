import { Button } from "@/components/ui/button";
import { Trash, Upload } from "lucide-react";
import Image from "next/image";
import React from "react";

type Props = {
    preview: string;
    onFileSelected: (file: FileList | null) => void;
    onClear: () => void;
};

const EditablePosterPreview = ({ preview, onFileSelected, onClear }: Props) => {
    const fileUpload = React.useRef<HTMLInputElement>(null);

    return (
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
                    onClick={onClear}
                >
                    <Trash />
                </Button>
                <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => onFileSelected(e.target.files)}
                    ref={fileUpload}
                />
                <Button
                    className="top-2 right-2"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileUpload.current?.click()}
                >
                    <Upload />
                </Button>
            </div>
        </div>
    );
};

export default EditablePosterPreview;
