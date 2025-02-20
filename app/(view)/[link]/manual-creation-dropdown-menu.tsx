"use client";

import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SiLetterboxd, SiSteam } from "@icons-pack/react-simple-icons";
import { FileJsonIcon, MoreHorizontalIcon, TableIcon } from "lucide-react";

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
                <DropdownMenuLabel>
                    Mass import from file
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-muted-foreground">
                    <TableIcon className="w-4 h-4" />
                    Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-muted-foreground">
                    <FileJsonIcon className="w-4 h-4" />
                    JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                    Mass import from website
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-muted-foreground">
                    <SiLetterboxd className="w-4 h-4" />
                    Letterboxd
                </DropdownMenuItem>
                <DropdownMenuItem className="text-muted-foreground">
                    <SiSteam className="w-4 h-4" />
                    Steam
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
