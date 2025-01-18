import { Toaster } from "@/components/ui/toaster";
import ModalStoreProvider from "@/providers/modal";
import { ModalQuerySync } from "@/query-params/modal";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { SearchParams } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
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

export default async function RootLayout({
    children,
}: React.PropsWithChildren) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={GeistSans.className}>
                <NuqsAdapter>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                    >
                        <Suspense>
                            <ModalStoreProvider>
                                <Suspense>{children}</Suspense>
                                <Suspense>
                                    <ModalQuerySync />
                                </Suspense>
                            </ModalStoreProvider>
                        </Suspense>
                        <Toaster />
                    </ThemeProvider>
                </NuqsAdapter>
            </body>
        </html>
    );
}
