import ContentPoster from "@/components/ui/content-poster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CollectionItem } from "@/utils/api/types";
import Link from "next/link";

type Props = {
    item: CollectionItem;
    className?: string;
}

export default function CollectionElement({ item, className }: Props) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Link href="/" className={cn("hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-md", className)}>
                        <ContentPoster posterUrl={item.posterUrl} size="sm" className="cursor-pointer" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>{item.content.name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}