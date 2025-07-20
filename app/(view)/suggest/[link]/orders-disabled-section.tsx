"use client";

import { Button } from "@/components/ui/button";
import ProfileSettingsTabButton from "@/components/view/dialog/profile-settings/tab-button";
import { useAuthStore } from "@/providers/auth-store";
import { ModalType } from "@/stores/modal";
import { PublicProfile } from "@/utils/api/types";
import Link from "next/link";

type Props = { profile: PublicProfile };

export default function OrdersDisabledSection({ profile }: Props) {
    const myProfile = useAuthStore((state) => state.profile);
    const isOwner = myProfile !== undefined && myProfile?.id == profile.id;

    return (
        <div className="grid gap-4 justify-items-center">
            <div className="text-sm font-medium">
                Suggestions are disabled for {profile.displayName}.
            </div>
            {isOwner && (
                <Button variant="link" size="sm" asChild>
                    <Link
                        href={`/${myProfile.username}?modal=${ModalType.ProfileSettings}&modalParams=tab=suggestions`}
                    >
                        You can enable this feature here.
                    </Link>
                </Button>
            )}
        </div>
    );
}
