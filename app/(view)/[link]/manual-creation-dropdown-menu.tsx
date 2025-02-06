"use client";

import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";

type Props = {
    className?: string;
}

export default function ManualCreationDropdownMenu({ className }: Props) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger>
                    <div className={cn(buttonVariants({ variant: "secondary", size: "icon" }), className)}>
                        <MoreHorizontalIcon />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>
                        Mass creation (.xlxs import) <br />
                        will be available soon
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
