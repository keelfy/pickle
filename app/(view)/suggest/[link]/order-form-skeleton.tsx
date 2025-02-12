import { cn } from "@/lib/utils";

type Props = {
    className?: string;
}

export default function OrderFormSkeleton({ className }: Props) {
    return (
        <div className={cn("grid gap-8 w-full h-full", className)}>
            <div className="grid space-y-6">
                <div className="flex justify-between gap-4 items-center w-full">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted-foreground/10 animate-pulse" />
                        <div className="w-20 h-4 rounded-full bg-muted-foreground/10 animate-pulse" />
                    </div>
                    <div className="h-10 w-24 rounded-sm bg-muted-foreground/10 animate-pulse" />
                </div>
                <div className="grid gap-2">
                    <div className="w-full h-4 rounded-full bg-muted-foreground/10 animate-pulse" />
                    <div className="w-full h-8 rounded-md bg-muted-foreground/10 animate-pulse" />
                    <div className="w-full h-24 rounded-md bg-muted-foreground/10 animate-pulse" />
                </div>
                <div className="w-full h-24 rounded-md bg-muted-foreground/10 animate-pulse" />
            </div>
            <div className="grid gap-3">
                <div className="h-10 w-full rounded-sm bg-muted-foreground/10 animate-pulse" />
                <div className="w-1/2 h-3 rounded-full bg-muted-foreground/10 animate-pulse" />
            </div>
        </div>
    );
}
