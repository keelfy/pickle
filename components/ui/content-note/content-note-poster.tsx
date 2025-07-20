import { cn } from "@/lib/utils";
import { ImageOffIcon } from "lucide-react";
import Image from "next/image";

type Props = {
    posterUrl: string | undefined;
    alt?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    loading?: boolean;
}

const sizes = {
    sm: [108, 144],
    md: [168, 224],
    lg: [336, 448],
}

const rounded = {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
}

export default function ContentNotePoster({ posterUrl, size = "md", className, loading = false, alt }: Props) {
    const [width, height] = sizes[size];

    return (posterUrl ? (
        <Image
            src={posterUrl}
            alt={alt ?? "Poster"}
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
            {!loading && (
                <div className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
                    <ImageOffIcon />
                    {alt && <span className="text-xs line-clamp-4 whitespace-normal">{alt}</span>}
                </div>
            )}
        </label>
    )
    )
}
