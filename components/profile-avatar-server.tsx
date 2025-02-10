import { fetchProfileAvatar } from "@/hooks/api-endpoints-server";
import { Profile } from "@/utils/api/types";
import { AvatarProps } from "@radix-ui/react-avatar";
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