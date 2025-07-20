import { fetchMyProfile } from "@/hooks/api-endpoints-server";
import getCurrentSession from "@/hooks/getCurrentSession";
import AuthStoreProvider from "@/providers/auth-store";
import React from "react";

export default async function RootLayout({ children }: React.PropsWithChildren) {

    // const session = await getCurrentSession();
    // const profile = session?.identity?.id ? await fetchMyProfile('md').catch(() => undefined) : undefined;

    // return (
    //     <AuthStoreProvider profile={profile} session={session}>
    //         {children}
    //     </AuthStoreProvider>
    // );
    return children;
}
