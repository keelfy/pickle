import { ThemeSwitcher } from "@/components/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import GameNoteEditorDialog from "@/components/view/dialog/game-note-editor/game-note-editor-dialog";
import { getProfileByLink } from "@/hooks/api-endpoints-server";
import OrderStoreProvider from "@/providers/order";
import ProfileStoreProvider from "@/providers/profile-store";
import { cn } from "@/utils/cn";
import {
    SiInstagram,
    SiTwitch,
    SiX,
    SiYoutube,
} from "@icons-pack/react-simple-icons";
import { Search } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";
import ApproveOrderDialog from "../../../components/view/dialog/approve-order/approve-order-dialog";
import CreateOrderDialog from "../../../components/view/dialog/create-order/create-order-dialog";
import DenyOrderDialog from "../../../components/view/dialog/deny-order/deny-order-dialog";
import ProfileSearchDialog from "../../../components/view/dialog/profile-search/profile-search-dialog";
import ProfileSettingsDialog from "../../../components/view/dialog/profile-settings/profile-settings-dialog";
import ProfileDropdownMenu from "../profile-dropdown-menu";
import MenuItemUnderline from "./menu-item-underline";
import OpenModalButton from "./open-modal-button";

async function LayoutBody({
    children,
    params,
}: React.PropsWithChildren<Props>) {
    const { link } = await params;
    let ownerProfile: Profile | undefined = undefined;

    try {
        ownerProfile = await getProfileByLink(link);
    } catch (error: any) {
        return (
            <div className="flex flex-col space-y-2 items-center justify-center h-full text-center">
                <p className="font-semibold text-lg">Profile not found.</p>
                <p className="text-red-300">{error.message}</p>
            </div>
        );
    }

    return (
        <ProfileStoreProvider profile={ownerProfile}>
            <DenyOrderDialog />
            <ApproveOrderDialog />
            <GameNoteEditorDialog />
            <ProfileSearchDialog />
            <CreateOrderDialog link={link} />
            <div className="flex gap-10">
                <Card className="min-w-96 w-min h-fit hidden md:block">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>
                                    {link.substring(0, 1)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5">
                                <CardTitle>{ownerProfile?.username}</CardTitle>
                                <CardDescription>Mega Streamer</CardDescription>
                            </div>
                            {/* <p className="text-md font-bold truncate">brDrLRVJLgdwTqXvPeezzkKqV</p> // 25 characters */}
                            {/* <p className="text-xl font-bold truncate w-48">LuxGp2F4CkyAJ17XRg2hprF6tTuEVhcHKWVtCx2U6cwcU158YxgCTEtyJcJT</p> // 64 characters */}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Lorem ipsum dolor sit amet, consectetur adipiscing
                            elit, sed do eiusmod tempor incididunt ut labore et
                            dolore magna aliqua. Ut enim ad minim veniam, quis
                            nostrud exercitation ullamco laboris nisi ut aliquip
                            ex ea commodo consequat. Duis aute irure dolor in
                            reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat
                            cupidatat non proident, sunt in culpa qui officia
                            deserunt mollit anim id est laborum.
                        </div>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-around gap-2">
                            <Button variant="outline" size="icon">
                                <SiTwitch />
                            </Button>
                            <Button variant="outline" size="icon">
                                <SiYoutube />
                            </Button>
                            <Button variant="outline" size="icon">
                                <SiX />
                            </Button>
                            <Button variant="outline" size="icon">
                                <SiInstagram />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex-0 w-full">
                    <Suspense>{children}</Suspense>
                </div>
            </div>
        </ProfileStoreProvider>
    );
}

async function NavMenu({ params }: Props) {
    const { link } = await params;
    return (
        <div className="flex items-center border border-foreground/10 rounded-lg p-2 px-3">
            <NavigationMenu>
                <NavigationMenuList>
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
                        modalName="search"
                        className={cn(
                            navigationMenuTriggerStyle(),
                            "text-foreground w-10 h-10"
                        )}
                    >
                        <Search />
                    </OpenModalButton>
                    <div className="px-3">
                        <Separator orientation="vertical" className="h-8" />
                    </div>
                    <Suspense fallback={<LoadingSpinner />}>
                        <ProfileDropdownMenu />
                    </Suspense>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );
}

type Props = {
    params: Promise<{
        link: string;
    }>;
};

function RootLayout({ children, params }: React.PropsWithChildren<Props>) {
    return (
        <main className="min-h-screen bg-background">
            <ProfileSettingsDialog />

            <div className="flex-1 h-full w-full flex flex-col gap-20">
                <nav className="container mx-auto flex items-start justify-center pt-10 gap-10">
                    <div className="hidden items-center gap-10 md:flex">
                        {/* <Button variant="default" className="font-bold">
                            Suggest Something
                        </Button> */}
                        <NavMenu params={params} />
                    </div>
                </nav>

                <OrderStoreProvider>
                    <div className="container mx-auto">
                        <LayoutBody params={params}>{children}</LayoutBody>
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
