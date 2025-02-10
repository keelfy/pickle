import { cn } from "@/lib/utils";
import { ImageOffIcon } from "lucide-react";
import Image from "next/image";

type Props = {
    posterUrl: string | undefined;
    size?: "sm" | "md" | "lg";
    className?: string;
    loading?: boolean;
}

const sizes = {
    sm: [100, 150],
    md: [150, 225],
    lg: [300, 450],
}

const rounded = {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
}

export default function ContentPoster({ posterUrl, size = "md", className, loading = false }: Props) {
    const [width, height] = sizes[size];

    return (posterUrl ? (
        <Image
            src={posterUrl}
            alt="Poster"
            width={width}
            height={height}
            className={cn("object-cover", rounded[size], className)}
            style={{ width: `${width}px`, height: `${height}px` }}
            unoptimized
        />
    ) : (
        <label
            className={cn("flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-900", loading ? "animate-pulse" : "", rounded[size], className)}
            style={{ width: `${width}px`, height: `${height}px` }}
        >
            {!loading && <ImageOffIcon />}
        </label>
    )
    )
}
