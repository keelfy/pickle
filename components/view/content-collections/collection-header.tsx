import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Props = {
    leftSide?: React.ReactNode;
    rightSide?: React.ReactNode;
    className?: string;
}

export default function CollectionHeader({ leftSide, rightSide, className }: Props) {
    return (
        <div className={cn("flex items-center", className)}>
            {leftSide}
            <Separator className={cn("flex-1", leftSide && "ml-2", rightSide && "mr-2")} />
            {rightSide}
        </div>
    )
}
