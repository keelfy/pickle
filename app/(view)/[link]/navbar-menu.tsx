import LanguageDropdownMenu from "@/components/language-dropdown-menu";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ModalType } from "@/stores/modal";
import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import ProfileDropdownMenu from "../profile-dropdown-menu";
import CurrentDate from "./current-date";
import MenuItemUnderline from "./menu-item-underline";
import OpenModalButton from "./open-modal-button";

type Props = {
    link: string;
    className?: string;
};

export default function NavMenu({ link, className }: Props) {
    return (
        <div className={cn("flex items-center justify-between pt-2", className)}>
            <NavigationMenu>
                <NavigationMenuList>
                    <Button variant="ghost" size="icon">
                        <Menu />
                    </Button>
                    <NavigationMenuItem>
                        <MenuItemUnderline link={`/${link}`}>
                            <Link href={`/${link}`} legacyBehavior passHref>
                                <NavigationMenuLink
                                    className={navigationMenuTriggerStyle()}
                                >
                                    Overview
                                </NavigationMenuLink>
                            </Link>
                        </MenuItemUnderline>
                    </NavigationMenuItem>
                    <div className="px-3">
                        <Separator orientation="vertical" className="h-8" />
                    </div>
                    <NavigationMenuItem>
                        <MenuItemUnderline link={`/${link}/games`}>
                            <Link
                                href={`/${link}/games`}
                                legacyBehavior
                                passHref
                            >
                                <NavigationMenuLink
                                    className={navigationMenuTriggerStyle()}
                                >
                                    Games
                                </NavigationMenuLink>
                            </Link>
                        </MenuItemUnderline>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href={`/${link}/movies`} legacyBehavior passHref>
                            <NavigationMenuLink
                                className={navigationMenuTriggerStyle()}
                            >
                                Movies
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href="#" legacyBehavior passHref>
                            <NavigationMenuLink
                                className={navigationMenuTriggerStyle()}
                            >
                                Series
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href="#" legacyBehavior passHref>
                            <NavigationMenuLink
                                className={navigationMenuTriggerStyle()}
                            >
                                Anime
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href="#" legacyBehavior passHref>
                            <NavigationMenuLink
                                className={navigationMenuTriggerStyle()}
                            >
                                Video
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    <OpenModalButton
                        modal={ModalType.ProfileSearch}
                        className={cn(
                            navigationMenuTriggerStyle(),
                            "text-foreground h-10 flex items-center gap-2"
                        )}
                    >
                        <Search />
                        <kbd className="pointer-events-none inline-flex select-none items-center gap-1 h-5 rounded bg-secondary px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </OpenModalButton>
                </NavigationMenuList>
            </NavigationMenu>
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-4">
                    <CurrentDate />
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="icon">
                            <Bell />
                        </Button>
                        <LanguageDropdownMenu variant="short" />
                    </div>
                </div>

                <Suspense fallback={<LoadingSpinner />}>
                    <ProfileDropdownMenu />
                </Suspense>
            </div>
        </div>
    );
}
