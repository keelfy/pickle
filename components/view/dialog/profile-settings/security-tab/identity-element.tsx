"use client";

import { linkProviderAction, unlinkProviderAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/providers/auth-store";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/client";
import { IconType } from "@icons-pack/react-simple-icons";
import { Provider } from "@supabase/supabase-js";
import { Link2, Link2OffIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

type Props = {
    className?: string;
    providerType: Provider;
    providerName: string;
    providerIcon: IconType;
    providerColor: string;
};

export default function ProviderIdentityElement({
    className,
    providerType,
    providerName,
    providerIcon: ProviderIcon,
    providerColor,
}: Props) {
    const [isPending, startTransition] = React.useTransition();

    const identities = useAuthStore((store) => store.user?.identities);
    const identity = identities?.find((i) => i.provider === providerType);
    const canUnlink =
        (identities ?? []).filter((i) => i.provider !== providerType).length >
        0;
    const updateUser = useAuthStore((store) => store.updateUser);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const onClick = () =>
        startTransition(async () => {
            if (identity) {
                await unlinkProviderAction(providerType);
            } else {
                await linkProviderAction(
                    providerType,
                    `${pathname}?${searchParams.toString()}`
                );
            }

            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) updateUser(user);
        });

    React.useEffect(() => {
        const toRemove = ["providerError", "linkingError"];
        const hasAny = toRemove.some((k) => searchParams.has(k));
        if (!hasAny) return;

        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            toRemove.forEach((key) => params.delete(key));

            const suffix = params.toString() ? `?${params}` : "";
            router.replace(pathname + suffix);
        }, 5000);

        return () => clearTimeout(timer);
    }, [searchParams.get("providerError"), searchParams.get("linkingError")]);

    return (
        <div className="-space-y-1">
            <div
                className={cn(
                    "flex space-x-4 justify-between items-center",
                    className
                )}
            >
                <div className="flex-1 flex flex-col space-y-2">
                    <div className="flex-1 flex items-center space-x-2 text-sm">
                        <ProviderIcon
                            className={`w-3 h-3 text-[#${providerColor}] text-sm`}
                        />
                        <p className="font-mono">{providerName}</p>
                        {identity?.identity_data?.email && (
                            <div className="flex items-center space-x-2">
                                <span>&nbsp;&bull;&nbsp;</span>
                                <span className="text-muted-foreground">
                                    {identity?.identity_data?.email}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <Separator className="flex-0" />
                {canUnlink ? (
                    <Button
                        variant={identity ? "destructive" : "default"}
                        onClick={onClick}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <LoadingSpinner />
                        ) : identity ? (
                            <Link2OffIcon />
                        ) : (
                            <Link2 />
                        )}
                        {identity ? "Unlink" : "Link"}
                    </Button>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={identity ? "destructive" : "default"}
                            >
                                {isPending ? (
                                    <LoadingSpinner />
                                ) : identity ? (
                                    <Link2OffIcon />
                                ) : (
                                    <Link2 />
                                )}
                                {identity ? "Unlink" : "Link"}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            You can't unlink {providerName} since it's the only
                            one way to log in to your account. <br />
                            Please, set up the password or link another
                            third-party account first.
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            {searchParams.has("providerError") &&
                searchParams.get("providerError") === providerType && (
                    <p className="text-destructive text-xs w-80">
                        {searchParams.get("linkingError") ??
                            "Error occurred during linking process. Try again later."}
                    </p>
                )}
        </div>
    );
}
