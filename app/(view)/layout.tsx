import { ThemeSwitcher } from "@/components/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { fetchApi } from "@/utils/api/server";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase/server";
import { LogIn, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import OpenModalButton from "./[link]/open-modal-button";
import OpenModalDropdownMenuItem from "./[link]/open-modal-dropdown-menu-item";
import { OrderModalProvider } from "./[link]/order-modal-context";
import DropdownMenuSignOutItem from "./sign-out-button";
import LoggedOutProfileNavSection from "./logged-out-nav-menu-button";

async function ProfileNavSection() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    let profile: Profile | undefined = undefined;

    try {
        profile = user
            ? await fetchApi<Profile>(`/v1/users/${user?.id}`)
            : undefined;
    } catch (error: any) {
        console.log(error);
    }

    if (!user || !profile) {
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

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-background">
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
                                        <ProfileNavSection />
                                    </Suspense>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                    </div>
                </nav>

                <OrderModalProvider>
                    {/* <div className="flex flex-col gap-20 max-w-5xl p-5"> */}
                    <div className="container mx-auto">
                        <Suspense>{children}</Suspense>
                    </div>
                </OrderModalProvider>

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
