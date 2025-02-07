"use client";

import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useAuthStore } from "@/providers/auth-store";
import { LogInIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Props = {
    className?: string;
}

export default function AuthSuggestSection({ className }: Props) {
    const user = useAuthStore(state => state.user)
    const pathname = usePathname();
    const [isPending, startTransition] = React.useTransition();

    const onSignOut = () => startTransition(async () => {
        await signOutAction();
        window.location.reload();
    });

    if (!user) {
        return (
            <Link
                href={{
                    pathname: "/sign-in",
                    query: { goto: encodeURIComponent(pathname) },
                }}
            >
                <Button variant="secondary" className={className}>
                    <LogInIcon />
                    Sign In
                </Button>
            </Link>
        )
    }
    return (
        <Button
            variant="secondary"
            onClick={onSignOut}
            disabled={isPending}
            className={className}
        >
            {isPending ? <LoadingSpinner /> : <LogOutIcon />}
            Log Out
        </Button>
    )
}
