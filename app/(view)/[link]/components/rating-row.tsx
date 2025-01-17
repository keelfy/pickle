import { cn } from "@/utils/cn";
import { StarIcon } from "lucide-react";
import RateStarIcon from "./rate-star-icon";

type Props = {
    value: number | undefined;
};

export default function RatingRow({ value }: Props) {
    return (
        <div className="flex items-center gap-1">
            {[...Array(10)].map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "relative w-9 h-9 flex items-center justify-center transition-colors",
                        value && i < value
                            ? "text-yellow-400"
                            : "text-accent-foreground"
                    )}
                >
                    <label
                        className={cn(
                            "flex items-center justify-center text-xs absolute w-4 h-4 translate-y-0.5",
                            value && i < value && "text-accent"
                        )}
                    >
                        {i + 1}
                    </label>
                    <RateStarIcon
                        className={cn(
                            "w-9 h-9 transition-colors fill-none",
                            value && i < value && "fill-current"
                        )}
                    />
                </div>
            ))}
        </div>
    );
}
