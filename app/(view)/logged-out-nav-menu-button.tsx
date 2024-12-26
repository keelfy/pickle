"use client";

import { Button } from "@/components/ui/button";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { cn } from "@/utils/cn";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LoggedOutProfileNavSection() {
    "use client";

    const pathname = usePathname();

    return (
        <Link href={`/sign-in?goto=${encodeURI(pathname)}`}>
            <Button
                className={cn(
                    navigationMenuTriggerStyle(),
                    "text-foreground w-10 h-10"
                )}
            >
                <LogIn />
            </Button>
        </Link>
    );
}
