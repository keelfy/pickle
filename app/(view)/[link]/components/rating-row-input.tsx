"use client";

import React from "react";
import RatingStar from "./rating-star";
import { cn } from "@/lib/utils";

type Props = {
    value: number;
    onChange: (value: number | undefined) => void;
};

const RatingRowInput = ({ value, onChange }: Props) => {
    const [hoveredStar, setHoveredStar] = React.useState<number>(0);

    const handleStarClick = (starIndex: number) => {
        onChange(value === starIndex + 1 ? undefined : starIndex + 1);
    };

    return (
        <div className="flex items-center">
            {[...Array(10)].map((_, i) => (
                <button
                    key={i}
                    onClick={() => handleStarClick(i)}
                    type="button"
                    onMouseEnter={() => setHoveredStar(i + 1)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className={cn("px-0.5 transition-all duration-300", hoveredStar > i && "scale-110")}
                >
                    <RatingStar
                        active={i < value || hoveredStar > i}
                        number={i + 1}
                        pointer
                    />
                </button>
            ))}
        </div>
    );
};

export default RatingRowInput;
