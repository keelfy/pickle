"use client";

import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";

type Props = {
    className?: string;
}

export default function ManualCreationDropdownMenu({ className }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className={cn(buttonVariants({ variant: "secondary", size: "icon" }), className)}>
                    <MoreHorizontalIcon />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem className="text-muted-foreground">
                    Import from .xlxs
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
