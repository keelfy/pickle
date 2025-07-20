import ProfileAvatar from "@/components/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DropdownMenuDialogWrapper from "@/components/view/dialog/dropdown-menu-dialog-wrapper";
import ProfileSettingsDialog from "@/components/view/dialog/profile-settings/profile-settings-dialog";
import { fetchMyProfile } from "@/hooks/api-endpoints-server";
import getCurrentSession from "@/hooks/getCurrentSession";
import { cn } from "@/lib/utils";
import { ModalType } from "@/stores/modal";
import { MessageCircle, Settings, User, UsersIcon } from "lucide-react";
import Link from "next/link";
import OpenModalDropdownMenuItem from "./[link]/open-modal-dropdown-menu-item";
import LoggedOutProfileNavSection from "./logged-out-nav-menu-button";
import DropdownMenuSignOutItem from "./sign-out-button";

type Props = { className?: string; avatarSize?: "sm" | "md" | "lg" };

export default async function ProfileDropdownMenu({
    className,
    avatarSize = "md",
}: Props) {
    const session = await getCurrentSession();

    if (!session?.active) {
        return <LoggedOutProfileNavSection />;
    }

    const profile = await fetchMyProfile(avatarSize).catch(() => undefined);

    return (
        <DropdownMenuDialogWrapper>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="hover:opacity-80 transition-opacity cursor-pointer">
                    <ProfileAvatar
                        avatarUrl={profile?.avatarUrl}
                        size={avatarSize}
                        className={cn("w-12 h-12", className)}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex flex-col gap-0.5">
                                <div className="text-md">
                                    {profile?.displayName}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    {session?.identity?.traits.email}
                                </div>
                            </div>
                            <Badge>
                                <User size={16} />
                            </Badge>
                        </div>

                        <Button className="w-full" variant="secondary" asChild>
                            <Link href={`/${profile?.username}`}>My profile</Link>
                        </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {/* <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Moon />
                                Dark mode
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <ProfileDropdownThemeRadioGroup />
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub> */}
                        <DropdownMenuItem className="cursor-pointer" disabled>
                            <UsersIcon size={16} />
                            My follows
                        </DropdownMenuItem>
                        <OpenModalDropdownMenuItem
                            modal={ModalType.ProfileSettings}
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
