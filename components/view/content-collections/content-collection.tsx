"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { Collection, CollectionItem } from "@/utils/api/types";
import { ChevronDownIcon, PencilIcon, TrashIcon } from "lucide-react";
import React from "react";
import CollectionElement from "./collection-element";
import CollectionLine from "./collection-line";
import CollectionTitleButton from "./collection-title-button";
type Props = {
    collection: Collection;
    items?: CollectionItem[];
}

export default function ContentCollection({ collection, items }: Props) {
    const [collapsed, setCollapsed] = React.useState(false);
    const openModal = useModalStore((state) => state.openModal);

    const handleDeleteClick = () => {
        openModal(ModalType.DeleteCollectionAlert, {
            id: collection.id,
            name: collection.name,
        });
    }

    const CollectionHeaderRightSide = () => (
        <div className="flex items-center gap-0">
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
                <ChevronDownIcon className={cn("transition-transform duration-300", collapsed && "rotate-90")} />
            </Button>
            <Button variant="ghost" size="icon">
                <PencilIcon />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDeleteClick}>
                <TrashIcon />
            </Button>
        </div>
    )

    return (
        <div className="flex flex-col gap-4">
            <CollectionLine
                leftSide={<CollectionTitleButton name={collection.name} onClick={() => setCollapsed(!collapsed)} />}
                rightSide={<CollectionHeaderRightSide />}
            />
            <div className={cn("flex items-center gap-2", collapsed && "hidden")}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <CollectionElement key={index} item={{
                        id: "1",
                        createdAt: new Date(),
                        collectionId: "1",
                        posterUrl: undefined,
                        content: { id: "1", name: "This is a content name", category: "games" }
                    }} />
                ))}
            </div>
        </div>
    )
}
