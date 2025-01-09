import { Toaster } from "@/components/ui/toaster";
import { getMyProfile } from "@/hooks/api-endpoints-server";
import getUser from "@/hooks/getUser";
import ModalStoreProvider from "@/providers/modal";
import AuthStoreProvider from "@/providers/auth-store";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata = {
    metadataBase: new URL(defaultUrl),
    title: "pickle",
    description: "The pickle prototype",
};

type Props = {
    children: React.ReactNode;
};

async function getAuth() {
    try {
        const user = await getUser();
        const profile = await getMyProfile();
        return { user, profile };
    } catch (error: any) {
        return { user: undefined, profile: undefined };
    }
}

async function AuthorizedProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = await getAuth();

    return (
        <AuthStoreProvider profile={profile} user={user}>
            <Suspense>{children}</Suspense>
        </AuthStoreProvider>
    );
}

export default async function RootLayout({ children }: Props) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={GeistSans.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                >
                    <ModalStoreProvider>
                        <Suspense>
                            <AuthorizedProvider>{children}</AuthorizedProvider>
                        </Suspense>
                    </ModalStoreProvider>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
