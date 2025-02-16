"use client";

import ModalStoreProvider from "@/providers/modal";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React, { Suspense } from "react";

export default function RootProviders({ children }: React.PropsWithChildren) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
        >
            <Suspense>
                <NuqsAdapter>
                    <ModalStoreProvider>
                        {children}
                    </ModalStoreProvider>
                </NuqsAdapter>
            </Suspense>
        </ThemeProvider>
    );
}
