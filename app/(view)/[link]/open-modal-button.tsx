"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useModalStore } from "@/providers/modal";
import { ModalName } from "@/stores/modal";

type Props = ButtonProps & {
    modalName: ModalName;
    children?: React.ReactNode;
};

export default function OpenModalButton({
    modalName,
    children,
    ...props
}: Props) {
    const { openModal } = useModalStore((state) => state);

    return (
        <Button onClick={() => openModal(modalName)} {...props}>
            {children}
        </Button>
    );
}
