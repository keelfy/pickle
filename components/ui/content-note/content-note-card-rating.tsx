import { cn } from "@/lib/utils";

type Props = {
    rate: number | undefined;
}

const getRatingColor = (rate: number | undefined) => {
    if (!rate) return "text-gray-500";
    if (rate >= 7) return "text-green-500";
    if (rate >= 3) return "text-yellow-500";
    return "text-red-500";
}

export default function ContentNoteCardRating({ rate }: Props) {
    const ratingColor = getRatingColor(rate);
    return (
        <div className="inline-flex flex-col items-center justify-center px-8 py-6 bg-secondary rounded-lg">
            <div className="text-3xl font-bold text-muted-foreground">
                {rate ? (
                    <p>
                        <span className={cn("text-3xl font-bold", ratingColor)}>{rate}</span>/10
                    </p>
                ) : "N/A"}
            </div>
            <div className="font-semibold whitespace-nowrap">
                rating
            </div>
        </div>
    );
}
