"use client";

import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LoggedOutProfileNavSection() {
    const pathname = usePathname();

    return (
        <Link
            href={{
                pathname: "/sign-in",
                query: { goto: encodeURIComponent(pathname) },
            }}
        >
            <Button variant="secondary">
                <LogIn />
                Sign In
            </Button>
        </Link>
    );
}
