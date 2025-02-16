import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import RootProviders from "./root-providers";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata = {
    metadataBase: new URL(defaultUrl),
    title: "pickle",
    description: "The pickle website",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn(GeistSans.className, "antialiased")}>
                <RootProviders>
                    {children}
                    <Toaster />
                </RootProviders>
            </body>
        </html>
    );
}
