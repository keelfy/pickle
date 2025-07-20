"use client";

import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

export default function LoggedOutProfileNavSection() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const returnTo = React.useMemo(() => {
        return `${pathname}?${searchParams.toString()}`;
    }, [pathname, searchParams]);

    return (
        <Button variant="secondary" asChild>
            <Link
                href={{
                    pathname: `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser`,
                    query: {
                        return_to: returnTo
                    },
                }}
            >
                <LogIn />
                Sign In
            </Link>
        </Button>
    );
}
