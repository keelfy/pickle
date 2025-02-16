import { SiInstagram } from "@icons-pack/react-simple-icons";
import { Clapperboard, ShieldPlusIcon, SparklesIcon } from "lucide-react";

import { SiX } from "@icons-pack/react-simple-icons";

import { SiYoutube } from "@icons-pack/react-simple-icons";

import ProfileAvatar from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { getShortenedCount } from "@/lib/count-shortener";
import { cn } from "@/lib/utils";
import { PublicProfile } from "@/utils/api/types";
import { SiTwitch } from "@icons-pack/react-simple-icons";
import { Gamepad } from "lucide-react";
import Link from "next/link";
import { FollowButton } from "./follow-button";
import ManualCreationDropdownMenu from "./manual-creation-dropdown-menu";
import SuggestionLinkCopyButton from "./suggestion-link-copy-button";

type Props = {
    profile: PublicProfile;
    className?: string;
}

export default function ProfileCard({ profile, className }: Props) {
    return (
        <div className={cn("min-w-80 space-y-4", className)}>
            <div className="space-y-4">
                <div className="space-y-0.5">
                    <div className="text-3xl font-bold">
                        {profile.username}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div>
                            @{profile.link}
                        </div>
                        <div className="text-muted-foreground">
                            &bull;
                        </div>
                        <div>
                            {getShortenedCount(profile.counts?.followers ?? 0)} followers
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6 pl-4">
                    <ProfileAvatar avatarUrl={profile.avatarUrl} size="lg" className="h-36 w-36" />
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
                {profile.suggestionPreferences.enabled && (
                    <div className="flex items-center">
                        <Link
                            href={`/suggest/${profile.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                        >
                            <Button className="w-full rounded-r-none">
                                <SparklesIcon />
                                Suggest content
                            </Button>
                        </Link>
                        <SuggestionLinkCopyButton className="rounded-l-none" />
                    </div>
                )}
                <div className={cn("flex items-center", !profile.isAuthorized && "hidden")}>
                    <Button variant="secondary" className="w-full rounded-r-none">
                        <ShieldPlusIcon />
                        Add a title manually
                    </Button>
                    <ManualCreationDropdownMenu className="rounded-l-none" />
                </div>
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