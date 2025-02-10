"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { PlusIcon } from "lucide-react";

type Props = {
    className?: string;
}

export default function CreateCollectionButton({ className }: Props) {
    const openModal = useModalStore(state => state.openModal);

    return (
        <Button
            variant='link'
            className={cn("text-start flex items-center flex-shrink-0 gap-2 p-0 text-muted-foreground", className)}
            onClick={() => openModal(ModalType.CreateCollection)}
        >
            <PlusIcon />
            <h2 className="text-lg">Add collection of content</h2>
        </Button>
    )
}
