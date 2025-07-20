import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = { className?: string };

export default function MFAElement({ className }: Props) {

    return (
        <div
            className={cn(
                "flex space-x-4 justify-between items-center",
                className
            )}
        >
            <div className="flex-1 flex flex-col space-y-2">
                <p>MFA</p>
                <div className="text-xs text-muted-foreground">
                    You can enable multi-factor authentication to add an extra
                    layer of security to your account.
                </div>
            </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        onClick={() => null}
                    >
                        Set up
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    MFA can only be enabled if you have password set up.
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
