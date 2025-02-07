"use client";

import { Button } from "@/components/ui/button";
import { followProfile, unfollowProfile } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { useProfileStore } from "@/providers/profile-store";
import { HeartCrackIcon, HeartIcon } from "lucide-react";
import React from "react";
import useRedirectToLogin from "@/hooks/use-redirect-to-login";

type Props = {
    className?: string;
}

export function FollowButton({ className }: Props) {
    const { profile, update } = useProfileStore(state => state);
    const user = useAuthStore(state => state.user);
    const [isFollowing, setIsFollowing] = React.useState<boolean>(profile?.isFollowing ?? false);
    const [isHovering, setIsHovering] = React.useState<boolean>(false);
    const [isPending, startTransition] = React.useTransition();
    const redirectToLogin = useRedirectToLogin();

    const handleFollow = () => startTransition(async () => {
        if (!user) {
            redirectToLogin();
            return;
        }

        const prevValue = isFollowing;
        try {
            setIsFollowing(true);
            await followProfile(profile);

            if (profile?.counts) {
                update({
                    ...profile,
                    counts: {
                        ...profile.counts,
                        followers: profile.counts.followers + 1,
                    },
                });
            }
        } catch (error: any) {
            toast({
                title: "Failed to follow " + profile?.username,
                description: error.message || "An error occurred",
                variant: "destructive",
            });
            setIsFollowing(prevValue);
        }
    });

    const handleUnfollow = () => startTransition(async () => {
        if (user?.id === profile?.id) {
            return;
        }

        const prevValue = isFollowing;
        try {
            setIsFollowing(false);
            await unfollowProfile(profile);

            if (profile?.counts) {
                update({
                    ...profile,
                    counts: {
                        ...profile.counts,
                        followers: profile.counts.followers - 1,
                    },
                });
            }
        } catch (error: any) {
            toast({
                title: "Failed to unfollow " + profile?.username,
                description: error.message || "An error occurred",
                variant: "destructive",
            });
            setIsFollowing(prevValue);
        }
    });

    React.useEffect(() => {
        setIsFollowing(profile?.isFollowing ?? false);
    }, [profile?.isFollowing]);

    return (
        <Button
            variant="outline"
            className={cn("px-2 text-xs", className)}
            onClick={isFollowing ? handleUnfollow : handleFollow}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            disabled={isPending}
        >
            <div className="relative text-red-500 mr-2">
                <HeartIcon
                    size={16}
                    fill={isFollowing ? "currentColor" : "none"}
                    strokeWidth={1.5}
                    className={cn("w-4 h-4 absolute transition-opacity duration-500 -top-2 -left-2 opacity-100",
                        isHovering && isFollowing && "opacity-0",
                        isPending && "animate-pulse"
                    )}
                />
                <HeartCrackIcon
                    size={16}
                    strokeWidth={1.5}
                    className={cn("w-4 h-4 absolute transition-opacity duration-500 opacity-0 -top-2 -left-2",
                        isHovering && isFollowing && "opacity-100",
                        isPending && "animate-pulse"
                    )}
                />
            </div>
            {isFollowing ? "Unfollow" : "Follow"}
        </Button>
    );
}
