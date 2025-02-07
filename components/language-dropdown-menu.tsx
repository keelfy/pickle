"use client";

import { cn } from "@/lib/utils";
import { EarthIcon } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuRadioItem, DropdownMenuRadioGroup, DropdownMenuContent } from "./ui/dropdown-menu";

type Props = {
    variant?: "short" | "default";
    className?: string;
}

export default function LanguageDropdownMenu({ variant = "default", className }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("px-2", className)}>
                    <div className="flex items-center gap-1">
                        <EarthIcon />
                        {variant === "short" ? "EN" : "English"}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-content">
                <DropdownMenuRadioGroup value="en">
                    <DropdownMenuRadioItem value="en">
                        English
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ru" disabled>
                        Русский
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="es" disabled>
                        Español
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
