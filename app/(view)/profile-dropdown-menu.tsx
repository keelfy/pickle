import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DropdownMenuDialogWrapper from "@/components/view/dialog/dropdown-menu-dialog-wrapper";
import ProfileSettingsDialog from "@/components/view/dialog/profile-settings/profile-settings-dialog";
import { getMyAvatar, getMyProfile } from "@/hooks/api-endpoints-server";
import getUser from "@/hooks/getUser";
import { MessageCircle, Moon, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import OpenModalDropdownMenuItem from "./[link]/open-modal-dropdown-menu-item";
import LoggedOutProfileNavSection from "./logged-out-nav-menu-button";
import ProfileDropdownThemeRadioGroup from "./profile-dropdown-theme-radio-group";
import DropdownMenuSignOutItem from "./sign-out-button";

export default async function ProfileDropdownMenu() {
    const user = await getUser();

    if (!user) {
        return <LoggedOutProfileNavSection />;
    }

    // const profile = await getMyProfile().catch(() => undefined);
    // const avatarUrl = await getMyAvatar("md")
    //     .then((res) => res?.url)
    //     .catch(() => undefined);

    const profile = undefined,
        avatarUrl = undefined;

    return (
        <DropdownMenuDialogWrapper>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    asChild
                >
                    <Avatar className="w-14 h-14">
                        <AvatarImage src={avatarUrl} asChild>
                            {avatarUrl && (
                                <Image
                                    src={avatarUrl}
                                    alt="Avatar"
                                    width={64}
                                    height={64}
                                    unoptimized
                                />
                            )}
                        </AvatarImage>
                        <AvatarFallback>
                            {profile?.username?.substring(0, 1) ??
                                user?.email?.substring(0, 1) ??
                                "U"}
                        </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex flex-col gap-0.5">
                                <div className="text-md">
                                    {profile?.username}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    {user?.email}
                                </div>
                            </div>
                            <Badge>
                                <User size={16} />
                            </Badge>
                        </div>
                        <Link href={`/${profile?.link}`}>
                            <Button className="w-full" variant="secondary">
                                My profile
                            </Button>
                        </Link>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Moon />
                                Dark mode
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <ProfileDropdownThemeRadioGroup />
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <OpenModalDropdownMenuItem
                            modalName="profile-settings"
                            className="cursor-pointer"
                        >
                            <Settings />
                            Settings
                        </OpenModalDropdownMenuItem>
                        <DropdownMenuItem disabled>
                            <MessageCircle />
                            Support
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuSignOutItem />
                </DropdownMenuContent>
            </DropdownMenu>
            <ProfileSettingsDialog />
        </DropdownMenuDialogWrapper>
    );
}
