import { cn } from "@/lib/utils";
import React from "react";
import RateStarIcon from "./rate-star-icon";

type Props = React.ComponentProps<"div"> & {
    active: boolean;
    number: number;
    pointer?: boolean;
};

export default function RatingStar({ active, number, className, pointer = false }: Props) {
    return (
        <div
            className={cn(
                "relative w-9 h-9 flex items-center justify-center transition-colors",
                pointer && "cursor-pointer",
                className
            )}
        >
            <label
                className={cn(
                    "flex items-center justify-center text-xs absolute w-4 h-4 translate-y-0.5 transition-colors duration-300 text-primary dark:text-accent",
                    !active && "dark:text-primary",
                    pointer && "cursor-pointer"
                )}
            >
                {number}
            </label>
            <RateStarIcon
                fill="currentColor"
                className={cn(
                    "w-9 h-9 transition-colors duration-300 text-primary-foreground",
                    active && "text-yellow-400"
                )}
                strokeWidth={0.5}
                strokeLinecap='round'
                strokeLinejoin='round'
                paintOrder='fill stroke'
            />
        </div>
    );
}
