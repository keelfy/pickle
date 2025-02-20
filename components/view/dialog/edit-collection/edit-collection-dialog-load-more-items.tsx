"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { useCollectionContext } from "../../../ui/content-collections/collections-context";
import LoadingSpinner from "@/components/ui/loading-spinner";

type Props = {
    collectionId: string;
}

export default function EditCollectionDialogLoadMoreItems({ collectionId }: Props) {
    const [isLoading, startTransition] = React.useTransition();
    const { loadMoreItems } = useCollectionContext();

    const onLoadMoreItems = () => startTransition(async () => {
        await loadMoreItems(collectionId);
    });

    return (
        <Button
            variant="outline"
            onClick={onLoadMoreItems}
            disabled={isLoading}
        >
            {isLoading ? <LoadingSpinner /> : "Load more items..."}
        </Button>
    )
}
