import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    getProfileAvatar,
    getProfileByLink,
} from "@/hooks/api-endpoints-server";
import OrderStoreProvider from "@/providers/order";
import ProfileStoreProvider from "@/providers/profile-store";
import { cn } from "@/utils/cn";
import {
    SiInstagram,
    SiTwitch,
    SiX,
    SiYoutube,
} from "@icons-pack/react-simple-icons";
import {
    Bell,
    Clapperboard,
    EarthIcon,
    Gamepad,
    Menu,
    Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";
import ApproveOrderDialog from "../../../components/view/dialog/approve-order/approve-order-dialog";
import CreateOrderDialog from "../../../components/view/dialog/create-order/create-order-dialog";
import DenyOrderDialog from "../../../components/view/dialog/deny-order/deny-order-dialog";
import ProfileSearchDialog from "../../../components/view/dialog/profile-search/profile-search-dialog";
import ProfileDropdownMenu from "../profile-dropdown-menu";
import CurrentDate from "./current-date";
import MenuItemUnderline from "./menu-item-underline";
import OpenModalButton from "./open-modal-button";

async function ProfileAvatar({ profile }: { profile: Profile | undefined }) {
    const avatarUrl = await getProfileAvatar(profile, "lg")
        .then((res) => res?.url ?? undefined)
        .catch(() => undefined);

    return (
        <Avatar className="h-32 w-32">
            <AvatarImage src={avatarUrl} asChild>
                {avatarUrl && (
                    <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={128}
                        height={128}
                        unoptimized
                    />
                )}
            </AvatarImage>
            <AvatarFallback>{profile?.link.substring(0, 1)}</AvatarFallback>
        </Avatar>
    );
}

async function LayoutBody({
    children,
    params,
}: React.PropsWithChildren<Props>) {
    const { link } = await params;

    const ownerProfile = await getProfileByLink(link).catch(
        (error: any) => error.message
    );

    if (!ownerProfile || typeof ownerProfile === "string") {
        return (
            <div className="flex flex-col space-y-2 items-center justify-center h-full text-center">
                <p className="font-semibold text-lg">Profile not found.</p>
                <p className="text-red-300">{ownerProfile}</p>
            </div>
        );
    }

    return (
        <ProfileStoreProvider profile={ownerProfile}>
            <div className="flex gap-10">
                <div className="min-w-80 w-min h-fit hidden md:block space-y-4">
                    <div className="space-y-4">
                        <div className="text-3xl font-bold px-6">
                            {ownerProfile?.username}
                        </div>
                        <div className="flex items-center justify-between px-4">
                            <Suspense
                                fallback={
                                    <Avatar className="h-32 w-32">
                                        <AvatarFallback>
                                            {link.substring(0, 1)}
                                        </AvatarFallback>
                                    </Avatar>
                                }
                            >
                                <ProfileAvatar profile={ownerProfile} />
                            </Suspense>
                            <table className="w-[40%]">
                                <tbody>
                                    <tr>
                                        <td>
                                            <Gamepad size="2.5rem" />
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <div className="text-sm text-muted-foreground">
                                                    played
                                                </div>
                                                <div className="text-2xl font-semibold">
                                                    38
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Clapperboard size="2.5rem" />
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <div className="text-sm text-muted-foreground">
                                                    watched
                                                </div>
                                                <div className="text-2xl font-semibold">
                                                    3
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="rounded-xl bg-primary-foreground p-6 text-sm text-muted-foreground">
                        {(ownerProfile?.description ?? "").length > 0 ? (
                            ownerProfile?.description
                        ) : (
                            <div className="italic">
                                No description provided yet.
                            </div>
                        )}
                    </div>
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
                </div>

                <div className="flex-0 w-full">
                    <Suspense>{children}</Suspense>
                </div>
            </div>

            <DenyOrderDialog />
            <ApproveOrderDialog />
            <GameNoteEditorDialog />
            <ProfileSearchDialog />
            <CreateOrderDialog link={link} />
        </ProfileStoreProvider>
    );
}

async function NavMenu({ params }: Props) {
    const { link } = await params;
    return (
        <div className="flex items-center justify-between">
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
                        modalName="search"
                        className={cn(
                            navigationMenuTriggerStyle(),
                            "text-foreground w-10 h-10"
                        )}
                    >
                        <Search />
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="px-2">
                                    <div className="flex items-center gap-1">
                                        <EarthIcon />
                                        EN
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-content">
                                <DropdownMenuRadioGroup value="en">
                                    <DropdownMenuRadioItem value="en">
                                        English
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="ru" disabled>
                                        Русский
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="es" disabled>
                                        Español
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Suspense fallback={<LoadingSpinner />}>
                    <ProfileDropdownMenu />
                </Suspense>
            </div>
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
        <main className="min-h-screen bg-background grid gap-10">
            <div className="container max-w-7xl flex flex-col gap-10">
                <nav className="mt-2">
                    <Suspense>
                        <NavMenu params={params} />
                    </Suspense>
                </nav>

                <Suspense>
                    <OrderStoreProvider>
                        <LayoutBody params={params}>{children}</LayoutBody>
                    </OrderStoreProvider>
                </Suspense>
            </div>
            <footer className="flex items-center justify-center border-t text-center text-xs py-6">
                <p>
                    Powered&nbsp;by&nbsp;
                    <Link
                        href="https://pickle.pw/"
                        target="_blank"
                        className="font-bold hover:underline"
                        rel="noreferrer"
                    >
                        pickle
                    </Link>
                </p>
            </footer>
        </main>
    );
}

export default RootLayout;
