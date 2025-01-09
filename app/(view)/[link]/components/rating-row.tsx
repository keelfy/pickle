import { cn } from "@/utils/cn";
import { StarIcon } from "lucide-react";

type Props = {
    value: number | undefined;
};

export default function RatingRow({ value }: Props) {
    return (
        <div className="flex items-center">
            {[...Array(10)].map((_, i) => (
                <StarIcon
                    key={i}
                    className={cn(
                        "w-6 h-6 cursor-pointer",
                        value && i < value ? "fill-current text-yellow-400" : "",
                    )}
                />
            ))}
        </div>
    );
}
