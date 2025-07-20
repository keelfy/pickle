import { ImageSize } from "@/utils/api/types";
import { AvatarProps } from "@radix-ui/react-avatar";
import { UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type Props = AvatarProps & {
    avatarUrl: string | undefined;
    size?: ImageSize;
}

const avatarSizes = {
    sm: 32,
    md: 64,
    lg: 128,
}

const avatarIconSizes = {
    sm: 4,
    md: 6,
    lg: 10,
}

export default function ProfileAvatar({ avatarUrl, size = "lg", className }: Props) {
    return (
        <Avatar className={className}>
            <AvatarImage
                src={avatarUrl}
                alt="Profile Avatar"
                width={avatarSizes[size]}
                height={avatarSizes[size]}
            />
            <AvatarFallback>
                <UserIcon className={`w-${avatarIconSizes[size]} h-${avatarIconSizes[size]}`} />
            </AvatarFallback>
        </Avatar>
    );
}