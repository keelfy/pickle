import { usePathname, useRouter } from "next/navigation";

export default function useRedirectToLogin() {
    const router = useRouter();
    const pathname = usePathname();

    return () => router.push(`/sign-in?goto=${encodeURIComponent(pathname)}`);
}
