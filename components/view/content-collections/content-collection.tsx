"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { Collection, CollectionItem } from "@/utils/api/types";
import React from "react";
import AddCollectionElement from "./add-collection-element";
import CollectionElement from "./collection-element";
import CollectionHeaderLine from "./collection-header";
import CollectionHeaderControls from "./collection-header-controls";
import CollectionHeaderTitleButton from "./collection-header-title-button";
import LoadMoreCollectionElement from "./load-more-collection-element";

type Props = {
    collection: Collection;
    items: CollectionItem[];
    hasMoreItems: boolean;
}

export default function ContentCollection({ collection, items, hasMoreItems }: Props) {
    const [collapsed, setCollapsed] = React.useState(false);
    const toggleCollapsed = () => setCollapsed(!collapsed);
    const user = useAuthStore((state) => state.user);
    const profile = useAuthStore((state) => state.profile);

    const isUserAuthorized = React.useMemo(() => {
        return user?.id !== undefined && profile?.id === user?.id;
    }, [profile?.id, user?.id]);

    return (
        <div className="flex flex-col">
            <CollectionHeaderLine
                leftSide={
                    <CollectionHeaderTitleButton
                        name={collection.name}
                        onClick={toggleCollapsed}
                    />
                }
                rightSide={
                    <CollectionHeaderControls
                        toggleCollapsed={toggleCollapsed}
                        collapsed={collapsed}
                        collection={collection}
                    />
                }
            />
            <ScrollArea className={cn("w-[856px] whitespace-nowrap", collapsed && "hidden")}>
                <div className="flex items-center gap-2 pb-3 pt-1">
                    {isUserAuthorized && <AddCollectionElement collection={collection} className="flex-shrink-0" />}
                    {items.map((item) => (
                        <CollectionElement key={item.id} item={item} className="flex-shrink-0" />
                    ))}
                    {hasMoreItems && <LoadMoreCollectionElement collectionId={collection.id} className="flex-shrink-0" />}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
