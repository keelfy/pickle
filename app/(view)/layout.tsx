import LoadingSpinner from "@/components/ui/loading-spinner";
import { fetchMyProfile } from "@/hooks/api-endpoints-server";
import getUser from "@/hooks/getUser";
import AuthStoreProvider from "@/providers/auth-store";
import React, { Suspense } from "react";

async function getAuth() {
    try {
        return await Promise.all([
            getUser(),
            fetchMyProfile()
        ]);
    } catch (error) {
        return [undefined, undefined];
    }
}

async function AuthorizedProvider({ children }: { children: React.ReactNode }) {
    const [user, profile] = await getAuth();

    return (
        <AuthStoreProvider profile={profile} user={user}>
            <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
        </AuthStoreProvider>
    );
}

function RootLayout({ children }: React.PropsWithChildren) {
    return <AuthorizedProvider>{children}</AuthorizedProvider>;
}

export default RootLayout;
