"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";

type Props = ButtonProps & {
    modal: ModalType;
    children?: React.ReactNode;
};

export default function OpenModalButton({
    modal,
    children,
    ...props
}: Props) {
    const { openModal } = useModalStore((state) => state);

    return (
        <Button onClick={() => openModal(modal)} {...props}>
            {children}
        </Button>
    );
}
