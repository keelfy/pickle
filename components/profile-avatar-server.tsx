import { fetchProfileAvatar } from "@/hooks/api-endpoints-server";
import { AvatarProps } from "@radix-ui/react-avatar";
import { User } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import ProfileAvatar from "./profile-avatar";

type Props = AvatarProps & {
    profile: Profile | undefined;
    size?: "sm" | "md" | "lg";
}

export default async function ProfileAvatarServer({ profile, size = "lg", className }: Props) {
    const avatarUrl = await fetchProfileAvatar(profile, size)
        .then((res) => res?.url ?? undefined)
        .catch(() => undefined);

    return <ProfileAvatar avatarUrl={avatarUrl} size={size} className={className} />;
}