"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModalName } from "./order-modal-context";

type Props = ButtonProps & {
    modalName: ModalName;
    children?: React.ReactNode;
};

export default function OpenModalButton({
    modalName,
    children,
    ...props
}: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const addSearchParam = () => {
        const params = new URLSearchParams(searchParams);
        params.set("modal", modalName);
        router.push(pathname + "?" + params.toString());
    };

    return (
        <Button onClick={addSearchParam} {...props}>
            {children}
        </Button>
    );
}
