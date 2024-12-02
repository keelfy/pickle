import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/cn";
import { Instagram, Search, Twitch, Twitter, Youtube } from "lucide-react";
import Link from "next/link";
import { OrderModalProvider } from "./[link]/order-modal-context";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <main className="min-h-screen bg-background">
            <div className="flex-1 h-full w-full flex flex-col gap-20">
                <nav className="container mx-auto flex items-start justify-center pt-10 gap-10">
                    <div className="flex items-center gap-10">
                        <Button variant="default" className="font-bold">Suggest Anything</Button>
                        <div className="flex items-center border border-foreground/10 rounded-lg p-2 px-3">
                            <Link
                                href="#"
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "flex items-center p-4 gap-4 h-14"
                                )}
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>K</AvatarFallback>
                                </Avatar>
                                <p className="text-xl font-bold">keelfy</p>
                            </Link>
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <div className="px-3">
                                        <Separator
                                            orientation="vertical"
                                            className="h-8"
                                        />
                                    </div>
                                    <NavigationMenuItem>
                                        {/* <div className="relative before:absolute before:bg-muted-foreground/20 before:origin-center before:h-[3px] before:rounded-r-md before:w-[40%] before:bottom-1 before:left-[50%] after:absolute after:bg-muted-foreground/20 after:origin-center after:h-[3px] after:rounded-l-md after:w-[40%] after:bottom-1 after:right-[50%]"> */}
                                        <Link href="#" legacyBehavior passHref>
                                            <NavigationMenuLink
                                                className={navigationMenuTriggerStyle()}
                                            >
                                                Games
                                            </NavigationMenuLink>
                                        </Link>
                                        {/* </div> */}
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
                                    <div className="px-3">
                                        <Separator
                                            orientation="vertical"
                                            className="h-8"
                                        />
                                    </div>
                                    <Button
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            "text-foreground"
                                        )}
                                    >
                                        <Search />
                                    </Button>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon">
                                <Twitch />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Youtube />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Twitter />
                            </Button>
                            <Button variant="outline" size="icon">
                                <Instagram />
                            </Button>
                        </div>
                    </div>
                </nav>

                <OrderModalProvider>
                    {/* <div className="flex flex-col gap-20 max-w-5xl p-5"> */}
                    <div className="container mx-auto">{children}</div>
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
                    <HeaderAuth />
                </footer>
            </div>
        </main>
    );
};

export default RootLayout;
