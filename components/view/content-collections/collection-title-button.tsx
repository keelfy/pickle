import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    name: string;
    icon?: React.ReactNode;
    className?: string;
}

export default function CollectionTitleButton({ name, icon, className, ...props }: Props) {
    return (
        <Button variant='link' className={cn("text-start flex items-center flex-shrink-0 gap-2 p-0", className)} {...props}>
            {icon}
            <h2 className="text-lg font-semibold">{name}</h2>
        </Button>
    )
}