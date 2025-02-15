import LoadingSpinner from "@/components/ui/loading-spinner";
import { fetchMyProfile } from "@/hooks/api-endpoints-server";
import getUser from "@/hooks/getUser";
import AuthStoreProvider from "@/providers/auth-store";
import { PublicProfile } from "@/utils/api/types";
import { User } from "@supabase/supabase-js";
import React, { Suspense } from "react";

async function getAuth() {
    let user: User | undefined;
    let profile: PublicProfile | undefined;

    try {
        user = await getUser();
        if (user) profile = await fetchMyProfile();
        return { user, profile };
    } catch (error) {
        return { user: undefined, profile: undefined };
    }
}

async function AuthorizedProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = await getAuth();

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
