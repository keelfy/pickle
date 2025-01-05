import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { getMyProfile } from "@/hooks/api-endpoints-server";
import { cn } from "@/utils/cn";
import Link from "next/link";
import OpenModalDropdownMenuItem from "./[link]/open-modal-dropdown-menu-item";
import LoggedOutProfileNavSection from "./logged-out-nav-menu-button";
import DropdownMenuSignOutItem from "./sign-out-button";

export default async function ProfileDropdownMenu() {
    const profile = await getMyProfile();

    if (!profile) {
        return <LoggedOutProfileNavSection />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    navigationMenuTriggerStyle(),
                    "text-foreground p-2 flex items-center gap-2"
                )}
            >
                <Avatar className="w-8 h-8">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>
                        {profile?.username?.substring(0, 1)}
                    </AvatarFallback>
                </Avatar>
                <span>{profile?.username}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44">
                <Link href={`/${profile?.link}`}>
                    <DropdownMenuItem className="cursor-pointer">
                        My page
                    </DropdownMenuItem>
                </Link>
                <OpenModalDropdownMenuItem
                    modalName="profile-settings"
                    className="cursor-pointer"
                >
                    Settings
                </OpenModalDropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSignOutItem />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
