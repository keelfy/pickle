"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { useProfileStore } from "@/providers/profile-store";

type Props = {
    className?: string;
}

export default function AuthorizedProfileElement({ children, className }: React.PropsWithChildren<Props>) {
    const profile = useProfileStore(state => state.profile);
    const user = useAuthStore(state => state.user);

    return (
        <div className={cn(className, (user?.id === undefined || profile?.id !== user?.id) && "hidden")}>
            {children}
        </div>
    )
}
