"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React from "react";

export default function MenuItemUnderline({
    link,
    children,
}: React.PropsWithChildren<{
    link: string;
}>) {
    const pathname = usePathname();

    // if (pathname !== link) {
    //     return children;
    // }

    return (
        <div
            className={cn(
                "relative before:absolute before:bg-muted-foreground/100 before:origin-center before:h-[2px] before:bottom-1 before:w-[0%] after:w-[0%] before:opacity-0 after:opacity-0 before:left-[50%] after:right-[50%] after:absolute after:bg-muted-foreground/100 after:origin-center after:h-[2px] after:bottom-1 before:transition-all after:transition-all",
                pathname === link &&
                    "before:w-[40%] after:w-[40%] before:opacity-100 after:opacity-100"
            )}
        >
            {children}
        </div>
    );
}
