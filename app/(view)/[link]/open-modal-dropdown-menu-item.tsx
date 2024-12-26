"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ModalName } from "./order-modal-context";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DropdownMenuItemProps } from "@radix-ui/react-dropdown-menu";

type Props = DropdownMenuItemProps & {
    modalName: ModalName;
    children?: React.ReactNode;
};

export default function OpenModalDropdownMenuItem({
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
        <DropdownMenuItem
            onClick={addSearchParam}
            {...props}
        >
            {children}
        </DropdownMenuItem>
    );
}
