import { Suspense } from "react";

type Props = {
    children: React.ReactNode;
};

export default function Layout({ children }: Props) {
    return (
        <div className="h-screen w-full px-4 flex items-center">
            <Suspense>{children}</Suspense>
        </div>
    );
}
