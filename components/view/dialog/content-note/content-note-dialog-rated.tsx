import RatingRow from "@/app/(view)/[link]/components/rating-row";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HeartIcon } from "lucide-react";

type Props = {
    rating?: number;
    className?: string;
}

export default function ContentNoteDialogRated({ rating, className }: Props) {
    return (
        <div className={cn("grid gap-1", className)}>
            <div className="flex items-center gap-2">
                <HeartIcon className="w-4 h-4" />
                <Label className="text-md font-semibold">
                    Rated
                </Label>
            </div>
            <RatingRow value={rating} />
        </div>
    )
}
