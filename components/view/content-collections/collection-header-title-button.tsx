import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmileIcon } from "lucide-react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    name: string;
    className?: string;
}

export default function CollectionHeaderTitleButton({ name, className, ...props }: Props) {
    return (
        <Button variant='link' className={cn("text-start flex items-center flex-shrink-0 gap-2 p-0", className)} {...props}>
            <h2 className="text-lg font-semibold">{name}</h2>
        </Button>
    )
}