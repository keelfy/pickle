import LanguageDropdownMenu from "@/components/language-dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import PickleLogo from "@/components/ui/icons/pickle-logo";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { localizeContentCategory } from "@/lib/localize-types";
import { cn } from "@/lib/utils";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import ProfileDropdownMenu from "../profile-dropdown-menu";
import MenuItemUnderline from "./menu-item-underline";
import OpenModalButton from "./open-modal-button";
import { ContentCategoryEnum } from "@/utils/api/types";
import { ModalType } from "@/stores/modal";
import { Label } from "@/components/ui/label";

type Props = {
    link: string;
    username: string;
    className?: string;
};

const CATEGORIES = [
    {
        category: ContentCategoryEnum.Games,
        enabled: true,
    },
    {
        category: ContentCategoryEnum.Movies,
        enabled: true,
    },
    {
        category: ContentCategoryEnum.Anime,
        enabled: false,
    },
    {
        category: ContentCategoryEnum.Series,
        enabled: false,
    },
    {
        category: ContentCategoryEnum.Video,
        enabled: false,
    }
];

export default function ProfileNavigationMenu({ link, username, className }: Props) {
    return (
        <div
            className={cn("flex items-center justify-between pt-2", className)}
        >
            <NavigationMenu>
                <NavigationMenuList>
                    <Link href="/">
                        <PickleLogo className="w-24 mr-6" />
                    </Link>
                    <NavigationMenuItem>
                        <MenuItemUnderline link={`/${link}`}>
                            <NavigationMenuLink
                                className={navigationMenuTriggerStyle()}
                                asChild
                            >
                                <Link href={`/${link}`} passHref>
                                    Overview
                                </Link>
                            </NavigationMenuLink>
                        </MenuItemUnderline>
                    </NavigationMenuItem>
                    <div className="px-3">
                        <Separator orientation="vertical" className="h-8" />
                    </div>
                    {CATEGORIES.map(({ category, enabled }) => (
                        <NavigationMenuItem
                            key={category}
                            className={cn(
                                !enabled &&
                                "opacity-50 text-muted-foreground"
                            )}
                        >
                            <MenuItemUnderline link={`/${link}/${category}`}>
                                {enabled ? (
                                    <NavigationMenuLink
                                        className={navigationMenuTriggerStyle()}
                                        asChild
                                    >
                                        <Link
                                            href={
                                                enabled
                                                    ? `/${link}/${category}`
                                                    : "#"
                                            }
                                        >
                                            {localizeContentCategory(
                                                category,
                                                true
                                            )}
                                        </Link>
                                    </NavigationMenuLink>
                                ) : (
                                    <NavigationMenuLink
                                        className={navigationMenuTriggerStyle()}
                                    >
                                        <Label>
                                            {localizeContentCategory(
                                                category,
                                                true
                                            )}
                                        </Label>
                                    </NavigationMenuLink>
                                )}
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
