import LanguageDropdownMenu from "@/components/language-dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { localizeContentCategory } from "@/lib/localize-types";
import { cn } from "@/lib/utils";
import { ModalType } from "@/stores/modal";
import { CONTENT_CATEGORIES } from "@/utils/api/types";
import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import ProfileDropdownMenu from "../profile-dropdown-menu";
import MenuItemUnderline from "./menu-item-underline";
import OpenModalButton from "./open-modal-button";

type Props = {
    link: string;
    className?: string;
};

const ENABLED_CATEGORIES = [
    "games",
    "movies",
]

export default function ProfileNavigationMenu({ link, className }: Props) {
    return (
        <div className={cn("flex items-center justify-between pt-2", className)}>
            <NavigationMenu>
                <NavigationMenuList>
                    <Button variant="ghost" size="icon" className={navigationMenuTriggerStyle()} disabled>
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
                    {CONTENT_CATEGORIES.map((category) => (
                        <NavigationMenuItem key={category} className={cn(!ENABLED_CATEGORIES.includes(category) && "opacity-50 text-muted-foreground")}>
                            <MenuItemUnderline link={`/${link}/${category}`}>
                                <Link
                                    href={ENABLED_CATEGORIES.includes(category) ? `/${link}/${category}` : "#"}
                                    legacyBehavior
                                    passHref
                                >
                                    <NavigationMenuLink
                                        className={navigationMenuTriggerStyle()}
                                    >
                                        {localizeContentCategory(category, true)}
                                    </NavigationMenuLink>
                                </Link>
                            </MenuItemUnderline>
                        </NavigationMenuItem>
                    ))}
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
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                    {/* <CurrentDate /> */}
                    {/* <Separator orientation="vertical" className="h-8" /> */}
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="icon">
                            <Bell />
                        </Button>
                        <LanguageDropdownMenu variant="short" />
                        <ThemeSwitcher />
                    </div>
                </div>

                <Suspense fallback={<LoadingSpinner />}>
                    <ProfileDropdownMenu />
                </Suspense>
            </div>
        </div>
    );
}
