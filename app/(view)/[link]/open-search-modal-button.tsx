"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
    className?: string;
};

const OpenSearchModalButton = ({ className }: Props) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const openSearchModal = () => {
        const params = new URLSearchParams(searchParams);
        params.set("modal", "search");
        router.push(pathname + "?" + params.toString());
    };

    return (
        <Button
            className={cn(className, "text-foreground w-10 h-10")}
            onClick={openSearchModal}
        >
            <Search />
        </Button>
    );
};

export default OpenSearchModalButton;
