"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useModalStore } from "@/providers/modal";
import { ModalName } from "@/stores/modal";
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
    const { openModal } = useModalStore((state) => state);

    return (
        <DropdownMenuItem onClick={() => openModal(modalName)} {...props}>
            {children}
        </DropdownMenuItem>
    );
}
