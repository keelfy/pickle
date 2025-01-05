import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import OrderStoreProvider from "@/providers/order";
import { cn } from "@/utils/cn";
import { Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import OpenModalButton from "./[link]/open-modal-button";
import ProfileSettingsModal from "./[link]/profile-settings-modal";
import LoggedOutProfileNavSection from "./logged-out-nav-menu-button";
import ProfileDropdownMenu from "./profile-dropdown-menu";

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-background">
            <ProfileSettingsModal />

            <div className="flex-1 h-full w-full flex flex-col gap-20">
                <nav className="container mx-auto flex items-start justify-center pt-10 gap-10">
                    <div className="flex items-center gap-10">
                        <Button variant="default" className="font-bold">
                            Suggest Something
                        </Button>
                        <div className="flex items-center border border-foreground/10 rounded-lg p-2 px-3">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <div className="relative before:absolute before:bg-muted-foreground/20 before:origin-center before:h-[3px] before:rounded-r-md before:w-[40%] before:bottom-1 before:left-[50%] after:absolute after:bg-muted-foreground/20 after:origin-center after:h-[3px] after:rounded-l-md after:w-[40%] after:bottom-1 after:right-[50%]">
                                            <Link
                                                href="#"
                                                legacyBehavior
                                                passHref
                                            >
                                                <NavigationMenuLink
                                                    className={navigationMenuTriggerStyle()}
                                                >
                                                    Overview
                                                </NavigationMenuLink>
                                            </Link>
                                        </div>
                                    </NavigationMenuItem>
                                    <div className="px-3">
                                        <Separator
                                            orientation="vertical"
                                            className="h-8"
                                        />
                                    </div>
                                    <NavigationMenuItem>
                                        <Link href="#" legacyBehavior passHref>
                                            <NavigationMenuLink
                                                className={navigationMenuTriggerStyle()}
                                            >
                                                Games
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link href="#" legacyBehavior passHref>
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
                                        modalName="search"
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            "text-foreground w-10 h-10"
                                        )}
                                    >
                                        <Search />
                                    </OpenModalButton>
                                    <div className="px-3">
                                        <Separator
                                            orientation="vertical"
                                            className="h-8"
                                        />
                                    </div>
                                    <Suspense
                                        fallback={
                                            <LoggedOutProfileNavSection />
                                        }
                                    >
                                        <ProfileDropdownMenu />
                                    </Suspense>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                    </div>
                </nav>

                <OrderStoreProvider>
                    <div className="container mx-auto">
                        <Suspense>{children}</Suspense>
                    </div>
                </OrderStoreProvider>

                <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
                    <p>
                        Powered&nbsp;by&nbsp;
                        <a
                            href="https://pickle.pw/"
                            target="_blank"
                            className="font-bold hover:underline"
                            rel="noreferrer"
                        >
                            pickle
                        </a>
                    </p>
                    <ThemeSwitcher />
                </footer>
            </div>
        </main>
    );
}

export default RootLayout;
