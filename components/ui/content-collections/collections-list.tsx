"use client";

import { useCollectionContext } from "./collections-context";
import ContentCollection from "./content-collection";

type Props = {
    isUserAuthorized: boolean;
}

export default function CollectionsList({ isUserAuthorized }: Props) {
    const { states: collections } = useCollectionContext();

    return collections.map((collection) => {
        if (collection.totalElements === 0 && !isUserAuthorized) return null;
        return (
            <ContentCollection
                key={collection.collection.id}
                collection={collection.collection}
                items={collection.content}
                hasMoreItems={collection.page < collection.totalPages - 1}
            />
        )
    })
}
