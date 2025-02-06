import { SiInstagram } from "@icons-pack/react-simple-icons";
import { Clapperboard, MoreHorizontalIcon, ShieldPlusIcon, SparklesIcon } from "lucide-react";

import { SiX } from "@icons-pack/react-simple-icons";

import { SiYoutube } from "@icons-pack/react-simple-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { fetchProfileAvatar } from "@/hooks/api-endpoints-server";
import { cn } from "@/lib/utils";
import { SiTwitch } from "@icons-pack/react-simple-icons";
import { Gamepad } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { FollowButton } from "./follow-button";
import SuggestionLinkCopyButton from "./suggestion-link-copy-button";
import ManualCreationDropdownMenu from "./manual-creation-dropdown-menu";
import AuthorizedProfileElement from "./authorized-profile-element";

type Props = {
    profile: Profile;
    className?: string;
}

const getFollowersCountText = (count: number) => {
    if (count === 0) return "0";
    if (count < 1000) return count;
    if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
    if (count < 1000000) return `${(count / 1000).toFixed(0)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
}

async function ProfileAvatar({ profile }: { profile: Profile | undefined }) {
    const avatarUrl = await fetchProfileAvatar(profile, "lg")
        .then((res) => res?.url ?? undefined)
        .catch(() => undefined);

    return (
        <Avatar className="h-36 w-36">
            <AvatarImage src={avatarUrl} asChild>
                {avatarUrl && (
                    <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={128}
                        height={128}
                        priority
                    />
                )}
            </AvatarImage>
            <AvatarFallback>{profile?.link.substring(0, 1)}</AvatarFallback>
        </Avatar>
    );
}

export default function ProfileCard({ profile, className }: Props) {
    return (
        <div className={cn("min-w-80 space-y-4", className)}>
            <div className="space-y-4">
                <div className="space-y-0.5">
                    <div className="text-3xl font-bold">
                        {profile?.username}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div>
                            @{profile.link}
                        </div>
                        <div className="text-muted-foreground">
                            &bull;
                        </div>
                        <div>
                            {getFollowersCountText(profile?.counts?.followers ?? 0)} followers
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6 pl-4">
                    <Suspense
                        fallback={
                            <Avatar className="h-32 w-32">
                                <AvatarFallback>
                                    {profile?.link.substring(0, 1)}
                                </AvatarFallback>
                            </Avatar>
                        }
                    >
                        <ProfileAvatar profile={profile} />
                    </Suspense>
                    <div className="flex flex-col gap-3 w-full">
                        <table className="w-min border-separate border-spacing-x-2">
                            <tbody>
                                <tr>
                                    <td>
                                        <Gamepad size="2rem" />
                                    </td>
                                    <td>
                                        <div className="flex flex-col -space-y-0.5 items-center">
                                            <div className="text-xs text-muted-foreground">
                                                played
                                            </div>
                                            <div className="text-xl font-semibold">
                                                {profile.counts?.played ?? 0}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Clapperboard size="2rem" />
                                    </td>
                                    <td>
                                        <div className="flex flex-col -space-y-0.5 items-center">
                                            <div className="text-xs text-muted-foreground">
                                                watched
                                            </div>
                                            <div className="text-xl font-semibold">
                                                {profile.counts?.watched ?? 0}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <FollowButton className="w-full flex-1" />
                    </div>
                </div>
            </div>
            <div className="grid gap-2">
                <div className="flex items-center">
                    <a href={`https://pickle.pw/${profile.link}/suggestion`} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button className="w-full rounded-r-none">
                            <SparklesIcon />
                            Suggest a title
                        </Button>
                    </a>
                    <SuggestionLinkCopyButton className="rounded-l-none" />
                </div>
                <AuthorizedProfileElement className="flex items-center">
                    <Button variant="secondary" className="w-full rounded-r-none">
                        <ShieldPlusIcon />
                        Add a title manually
                    </Button>
                    <ManualCreationDropdownMenu className="rounded-l-none" />
                </AuthorizedProfileElement>
            </div>
            <div className="rounded-xl bg-primary-foreground p-6 text-sm text-muted-foreground">
                {(profile?.description ?? "").length > 0 ? (
                    profile?.description
                ) : (
                    <div className="italic">
                        No description provided yet.
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 ml-4">
                <Button variant="secondary" size="icon">
                    <SiTwitch />
                </Button>
                <Button variant="secondary" size="icon">
                    <SiYoutube />
                </Button>
                <Button variant="secondary" size="icon">
                    <SiX />
                </Button>
                <Button variant="secondary" size="icon">
                    <SiInstagram />
                </Button>
            </div>
        </div>
    )
}