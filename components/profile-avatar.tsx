import { AvatarProps } from "@radix-ui/react-avatar";
import { User } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type Props = AvatarProps & {
    avatarUrl: string | undefined;
    size?: "sm" | "md" | "lg";
}

const getAvatarSize = (size: "sm" | "md" | "lg") => {
    switch (size) {
        case "sm":
            return 32;
        case "md":
            return 64;
        case "lg":
            return 128;
    }
}

export default function ProfileAvatar({ avatarUrl, size = "lg", className }: Props) {
    return (
        <Avatar className={className}>
            <AvatarImage src={avatarUrl} asChild>
                {avatarUrl && (
                    <Image
                        src={avatarUrl}
                        alt="Profile Avatar"
                        width={getAvatarSize(size)}
                        height={getAvatarSize(size)}
                        priority
                    />
                )}
            </AvatarImage>
            <AvatarFallback>
                <User />
            </AvatarFallback>
        </Avatar>
    );
}