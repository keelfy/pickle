"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/providers/profile-store";
import { CheckIcon, LinkIcon } from "lucide-react";
import { useCallback, useState } from "react";

export default function SuggestionLinkCopyButton(props: ButtonProps) {
    const profile = useProfileStore(state => state.profile);
    const [copied, setCopied] = useState(false);

    const copyLink = useCallback(() => {
        if (!profile) return;
        navigator.clipboard.writeText(`https://pickle.pw/suggest/${profile.username}`);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }, [profile]);

    return (
        <Button
            size='icon'
            onClick={copyLink}
            {...props}
        >
            <div className="relative h-4 w-4">
                <CheckIcon
                    className={cn(
                        "absolute transition-all duration-200",
                        copied
                            ? "scale-100 opacity-100 text-green-500"
                            : "scale-75 opacity-0"
                    )}
                />
                <LinkIcon
                    className={cn(
                        "absolute transition-all duration-200",
                        copied
                            ? "scale-75 opacity-0"
                            : "scale-100 opacity-100"
                    )}
                />
            </div>
        </Button>
    )
}
