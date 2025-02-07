import { Suspense } from "react";

export default function Layout({ children }: React.PropsWithChildren) {
    return (
        <div className="h-screen w-full px-4 flex items-center">
            <Suspense>{children}</Suspense>
        </div>
    );
}
