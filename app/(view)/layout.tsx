import { fetchMyProfile } from "@/hooks/api-endpoints-server";
import getUser from "@/hooks/getUser";
import AuthStoreProvider from "@/providers/auth-store";
import React from "react";

export default async function RootLayout({ children }: React.PropsWithChildren) {
    const user = await getUser().catch(() => undefined);
    const profile = user?.id ? await fetchMyProfile('md').catch(() => undefined) : undefined;

    return (
        <AuthStoreProvider profile={profile} user={user}>
            {children}
        </AuthStoreProvider>
    );
}
