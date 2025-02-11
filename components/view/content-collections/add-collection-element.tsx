"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { Collection } from "@/utils/api/types";
import { PlusIcon } from "lucide-react";

type Props = {
    collection: Collection;
    className?: string;
}

export default function AddCollectionElement({ collection, className }: Props) {
    const openModal = useModalStore(state => state.openModal);

    const handleClick = () => openModal(ModalType.AddCollectionItem, {
        id: collection.id,
    });

    return (
        <Button
            variant="outline"
            className={cn("flex flex-col items-center justify-center p-0 rounded-md", className)}
            style={{ width: `100px`, height: `150px` }}
            onClick={handleClick}
        >
            <PlusIcon />
            <p className="text-sm text-muted-foreground">Add</p>
        </Button>
    )
}