import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    name: string;
    totalItems: number;
    className?: string;
}

export default function CollectionHeaderTitleButton({ name, totalItems, className, ...props }: Props) {
    return (
        <Button variant='link' className={cn("text-start flex items-center flex-shrink-0 gap-2 p-0", className)} {...props}>
            <h2 className="text-lg font-semibold">{name}</h2>
            <span className="text-sm text-muted-foreground">({totalItems})</span>
        </Button>
    )
}