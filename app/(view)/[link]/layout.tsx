import DeleteContentAlertDialog from "@/components/view/dialog/delete-content-alert/delete-content-alert-dialog";
import GameNoteEditorDialog from "@/components/view/dialog/game-note-editor/game-note-editor-dialog";
import GameNoteDialog from "@/components/view/dialog/game-note/game-note-dialog";
import {
    fetchProfileByLink
} from "@/hooks/api-endpoints-server";
import OrderStoreProvider from "@/providers/order";
import ProfileStoreProvider from "@/providers/profile-store";
import Link from "next/link";
import React, { Suspense } from "react";
import ApproveOrderDialog from "../../../components/view/dialog/approve-order/approve-order-dialog";
import CreateOrderDialog from "../../../components/view/dialog/create-order/create-order-dialog";
import DenyOrderDialog from "../../../components/view/dialog/deny-order/deny-order-dialog";
import ProfileSearchDialog from "../../../components/view/dialog/profile-search/profile-search-dialog";
import NavMenu from "./navbar-menu";
import ProfileCard from "./profile-card";

async function LayoutBody({
    children,
    params,
}: React.PropsWithChildren<Props>) {
    const { link } = await params;

    const ownerProfile = await fetchProfileByLink(link).catch(
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
                <ProfileCard profile={ownerProfile} className="w-min h-fit hidden md:block" />

                <div className="flex-0 w-full">
                    <Suspense>{children}</Suspense>
                </div>
            </div>

            <DenyOrderDialog />
            <ApproveOrderDialog />
            <GameNoteDialog />
            <GameNoteEditorDialog />
            <ProfileSearchDialog />
            <CreateOrderDialog />
            <DeleteContentAlertDialog />
        </ProfileStoreProvider>
    );
}

export type Props = {
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
                        <NavMenu params={params} className="max-md:hidden" />
                    </Suspense>
                </nav>

                <Suspense>
                    <OrderStoreProvider>
                        <LayoutBody params={params}>{children}</LayoutBody>
                    </OrderStoreProvider>
                </Suspense>
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

export default RootLayout;
