"use client";

import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useAuthStore } from "@/providers/auth-store";
import { LogInIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

type Props = { className?: string };

export default function AuthSuggestSection({ className }: Props) {
    const session = useAuthStore((state) => state.session);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const returnTo = React.useMemo(() => {
        return `${pathname}?${searchParams.toString()}`;
    }, [pathname, searchParams]);

    const [isPending, startTransition] = React.useTransition();

    const onSignOut = () =>
        startTransition(async () => {
            await signOutAction();
            window.location.reload();
        });

    if (session === undefined || !session.active) {
        return (
            <Button variant="secondary" className={className}>
                <Link
                    href={{
                        pathname: `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser`,
                        query: { return_to: returnTo },
                    }}
                >
                    <LogInIcon />
                    Sign In
                </Link>
            </Button>
        );
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
    );
}
