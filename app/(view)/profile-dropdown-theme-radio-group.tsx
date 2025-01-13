"use client";

import {
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ProfileDropdownThemeRadioGroup() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(e) => setTheme(e)}
        >
            <DropdownMenuRadioItem value="system" className="flex gap-2">
                <Laptop className="text-muted-foreground" size={16} />
                System
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="flex gap-2">
                <Moon className="text-muted-foreground" size={16} />
                Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light" className="flex gap-2">
                <Sun className="text-muted-foreground" size={16} />
                Light
            </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
    );
}
