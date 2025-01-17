"use client";

import { cn } from "@/utils/cn";
import { StarIcon } from "lucide-react";
import React from "react";
import RateStarIcon from "./rate-star-icon";

type Props = {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
};

const RatingRowInput = ({ value, onChange }: Props) => {
    const [hoveredStar, setHoveredStar] = React.useState<number>();

    return (
        <div className="flex items-center gap-1">
            {[...Array(10)].map((_, i) => (
                <button
                    key={i}
                    className={cn(
                        "relative w-9 h-9 flex items-center justify-center transition-colors",
                        (value && i < value) ||
                            (hoveredStar !== undefined && hoveredStar >= i)
                            ? "text-yellow-400"
                            : "text-accent-foreground"
                    )}
                    onMouseEnter={() => setHoveredStar(i)}
                    onMouseLeave={() => setHoveredStar(undefined)}
                    onClick={() =>
                        value == i + 1 ? onChange(undefined) : onChange(i + 1)
                    }
                    type="button"
                >
                    <label
                        className={cn(
                            "flex items-center justify-center text-xs absolute w-4 h-4 translate-y-0.5 cursor-pointer",
                            value && i < value && "text-accent"
                        )}
                    >
                        {i + 1}
                    </label>
                    <RateStarIcon
                        className={cn(
                            "cursor-pointer w-9 h-9 transition-colors fill-none",
                            value && i < value && "fill-current"
                        )}
                    />
                </button>
            ))}
        </div>
    );
};

export default RatingRowInput;
