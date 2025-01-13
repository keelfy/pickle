import { getMyAvatar, getMyProfile } from "@/hooks/api-endpoints-server";
import getUser from "@/hooks/getUser";
import AuthStoreProvider from "@/providers/auth-store";
import React from "react";

async function getAuth() {
    let user, profile, avatarUrl;

    try {
        user = await getUser();
        if (user !== undefined) {
            profile = await getMyProfile();
            avatarUrl = await getMyAvatar("lg").then(
                (res) => res?.url ?? undefined
            );
        }
    } catch (error) {
        user = undefined;
        profile = undefined;
        avatarUrl = undefined;
    }
    return { user, profile, avatarUrl };
}

async function AuthorizedProvider({ children }: { children: React.ReactNode }) {
    const { user, profile, avatarUrl } = await getAuth();

    return (
        <AuthStoreProvider profile={profile} user={user} avatarUrl={avatarUrl}>
            {children}
        </AuthStoreProvider>
    );
}

function RootLayout({ children }: React.PropsWithChildren) {
    return <AuthorizedProvider>{children}</AuthorizedProvider>;
}

export default RootLayout;
