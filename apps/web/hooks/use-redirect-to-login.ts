import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

export default function useRedirectToLogin() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const returnTo = React.useMemo(() => {
        return `${pathname}?${searchParams.toString()}`;
    }, [pathname, searchParams]);

    return () => window.location.href = `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser?return_to=${returnTo}`;
}
