"use client";

import { cn } from "@/utils/cn";
import { StarIcon } from "lucide-react";
import React from "react";

type Props = {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
};

const RatingRow = ({ value, onChange }: Props) => {
    const [hoveredStar, setHoveredStar] = React.useState<number>();

    return (
        <div className="flex items-center">
            {[...Array(10)].map((_, i) => (
                <StarIcon
                    key={i}
                    onMouseEnter={() => setHoveredStar(i)}
                    onMouseLeave={() => setHoveredStar(undefined)}
                    onClick={() =>
                        value == i + 1 ? onChange(undefined) : onChange(i + 1)
                    }
                    className={cn(
                        "w-6 h-6 cursor-pointer",
                        value && i < value ? "fill-current" : "",
                        (value && i < value) ||
                            (hoveredStar && hoveredStar >= i)
                            ? "text-yellow-400"
                            : "text-accent-foreground",
                        "transition-colors"
                    )}
                />
            ))}
        </div>
    );
};

export default RatingRow;
