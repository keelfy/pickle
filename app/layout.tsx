import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata = {
    metadataBase: new URL(defaultUrl),
    title: "pickle",
    description: "The pickle prototype",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={GeistSans.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
};

export default RootLayout;
