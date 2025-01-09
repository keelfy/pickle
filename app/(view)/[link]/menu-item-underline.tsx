"use client";

import { usePathname } from "next/navigation";
import React from "react";

export default function MenuItemUnderline({
    link,
    children,
}: React.PropsWithChildren<{
    link: string;
}>) {
    const pathname = usePathname();

    if (pathname !== link) {
        return children;
    }

    return (
        <div className="relative before:absolute before:bg-muted-foreground/20 before:origin-center before:h-[3px] before:rounded-r-md before:w-[40%] before:bottom-1 before:left-[50%] after:absolute after:bg-muted-foreground/20 after:origin-center after:h-[3px] after:rounded-l-md after:w-[40%] after:bottom-1 after:right-[50%]">
            {children}
        </div>
    );
}
