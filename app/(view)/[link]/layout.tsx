import DeleteContentAlertDialog from "@/components/view/dialog/delete-content-alert/delete-content-alert-dialog";
import GameNoteCreatorDialog from "@/components/view/dialog/game-note-creator/game-note-creator-dialog";
import GameNoteEditorDialog from "@/components/view/dialog/game-note-editor/game-note-editor-dialog";
import GameNoteDialog from "@/components/view/dialog/game-note/game-note-dialog";
import ManualNoteCreationDialog from "@/components/view/dialog/manual-note-creation/manual-note-creation-dialog";
import MovieNoteCreatorDialog from "@/components/view/dialog/movie-note-creator/movie-note-creator-dialog";
import MovieNoteEditorDialog from "@/components/view/dialog/movie-note-editor/movie-note-editor-dialog";
import MovieNoteDialog from "@/components/view/dialog/movie-note/movie-note-dialog";
import SelectContentItemDialog from "@/components/view/dialog/select-content-item/select-content-item-dialog";
import {
    fetchProfileByLink
} from "@/hooks/api-endpoints-server";
import OrderStoreProvider from "@/providers/order";
import ProfileStoreProvider from "@/providers/profile-store";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import ApproveOrderDialog from "../../../components/view/dialog/approve-order/approve-order-dialog";
import CreateOrderDialog from "../../../components/view/dialog/create-order/create-order-dialog";
import DenyOrderDialog from "../../../components/view/dialog/deny-order/deny-order-dialog";
import ProfileSearchDialog from "../../../components/view/dialog/profile-search/profile-search-dialog";
import ProfileCard from "./profile-card";
import ProfileNavigationMenu from "./profile-nav-menu";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { link } = await params;

    const profile = await fetchProfileByLink(link, 'lg').catch(
        (error: any) => error.message
    );

    if (!profile || typeof profile === "string") {
        return {
            title: 'Profile not found - pickle'
        };
    }

    return {
        title: `${profile.username} - pickle`,
        description: `${profile.username} on pickle.pw with the content they want to share`,
        openGraph: {
            type: 'profile',
            title: `${profile.username} - pickle`,
            url: `https://pickle.pw/${profile.link}`,
            description: `${profile.username} on pickle.pw with the content they want to share`,
            siteName: 'pickle',
            images: [
                { url: profile.avatarUrl }
            ]
        }
    };
}

export type Props = {
    params: Promise<{
        link: string;
    }>;
};

export default async function RootLayout({ children, params }: React.PropsWithChildren<Props>) {
    const { link } = await params;

    const ownerProfile = await fetchProfileByLink(link, 'lg').catch(
        (error: any) => error.message
    );

    if (!ownerProfile || typeof ownerProfile === "string") {
        return (
            <div className="h-screen w-full px-4 flex items-center justify-center">
                <div className="flex flex-col gap-4 items-center">
                    <p className="text-xl font-medium">
                        The profile you are looking for does not exist.
                    </p>
                    <p className="text-destructive">
                        {ownerProfile ?? "Unknown error"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background grid gap-10">
            <div className="container max-w-7xl flex flex-col gap-10">
                <nav className="mt-2">
                    <ProfileNavigationMenu link={link} username={ownerProfile.username} className="max-md:hidden" />
                </nav>

                <OrderStoreProvider>
                    <ProfileStoreProvider profile={ownerProfile}>
                        <div className="flex gap-10">
                            <ProfileCard profile={ownerProfile} className="w-min h-fit hidden md:block" />

                            <div className="flex-1 w-full">
                                {children}
                            </div>
                        </div>

                        <DenyOrderDialog />
                        <ApproveOrderDialog />

                        <ProfileSearchDialog />
                        <CreateOrderDialog />
                        <DeleteContentAlertDialog />

                        <GameNoteDialog />
                        <MovieNoteDialog />

                        <ManualNoteCreationDialog />
                        <GameNoteEditorDialog />
                        <MovieNoteEditorDialog />
                        <GameNoteCreatorDialog />
                        <MovieNoteCreatorDialog />
                        <SelectContentItemDialog />
                    </ProfileStoreProvider>
                </OrderStoreProvider>
            </div>
            <footer className="flex items-center justify-center border-t text-center text-xs py-6 h-fit">
                <div className="flex flex-col items-center gap-2">
                    <p>
                        Powered&nbsp;by&nbsp;
                        <Link
                            href="https://pickle.pw/"
                            target="_blank"
                            className="font-bold hover:underline decoration-muted-foreground underline-offset-2"
                            rel="noreferrer"
                        >
                            pickle
                        </Link>
                    </p>
                    <div>
                        <Link href="/terms" target="_blank" className="hover:underline decoration-muted-foreground underline-offset-2">
                            Terms of Service
                        </Link>
                        &nbsp;&bull;&nbsp;
                        <Link href="/privacy" target="_blank" className="hover:underline decoration-muted-foreground underline-offset-2">
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
