"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { fetchAddCollectionItem, fetchProfileContentSearch } from "@/hooks/api-endpoints-client";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { contentCategoryLabels } from "@/utils/api/constants";
import { ContentSearchHits } from "@/utils/api/response";
import { CollectionItem, Content } from "@/utils/api/types";
import React from "react";
import { useCollectionContext } from "../../../ui/content-collections/collections-context";

export default function AddCollectionItemDialogContent() {
    const { modalParams, setModalParams, openModal, closeModal } = useModalStore((state) => state);
    const profile = useProfileStore((state) => state.profile);
    const [query, setQuery] = React.useState<string>(modalParams?.query ?? "");
    const debouncedQuery = useDebounce(query, 300);
    const [result, setResult] = React.useState<ContentSearchHits>();
    const { states: collections, addItemToCollection, deleteItemFromCollection, updateItemInCollection } = useCollectionContext();

    const GroupHeading: React.ReactNode = React.useMemo(
        () => (
            <>
                Best matches for profile&nbsp;
                <span className="font-bold">{profile?.displayName}</span>
            </>
        ),
        [profile?.displayName]
    );
    const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

    React.useEffect(() => {
        setModalParams({ ...modalParams, query: debouncedQuery });
    }, [debouncedQuery]);

    React.useEffect(() => {
        if (
            !debouncedQuery ||
            debouncedQuery.length < 2 ||
            debouncedQuery.length > 100
        ) {
            setResult(undefined);
            return;
        }

        (async () => {
            try {
                const response = await fetchProfileContentSearch(profile, debouncedQuery, 0, 10);
                setResult(response);
            } catch (error: any) {
                toast({
                    title: "Failed to fetch search results",
                    description: error.message ?? "An error occurred",
                });
            }
        })();
    }, [debouncedQuery]);

    React.useEffect(() => {
        setSelectedIndex(0);
    }, [result?.content]);

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
            if (!result?.content?.length) return;

            if (event.key === "ArrowDown") {
                setSelectedIndex((prev) =>
                    Math.min(prev + 1, result.content.length - 1)
                );
            } else if (event.key === "ArrowUp") {
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (event.key === "Enter") {
                const selectedContent = result.content[selectedIndex];
                if (selectedContent) {
                    handleItemClick(selectedContent.source);
                }
            }
        },
        [result?.content, selectedIndex, openModal]
    );

    const handleItemClick = (source: Content) => {
        if (!modalParams?.id) return;
        const collectionId = modalParams.id;
        const sameNote = collections.some(collection =>
            collection.collection.id === collectionId
            && collection.content.some(item => item.content.id === source.id && item.content.category === source.category)
        );

        if (sameNote) {
            toast({
                title: `Already in collection`,
                description: `"${source.title}" is already in the collection`,
                variant: "destructive",
            });
            return;
        }

        closeModal();
        (async () => {
            const optimisticCollectionItem: CollectionItem = {
                id: crypto.randomUUID(),
                createdAt: new Date(),
                collectionId: modalParams.id,
                content: source,
            };
            addItemToCollection(modalParams.id, optimisticCollectionItem);

            try {
                const response = await fetchAddCollectionItem(modalParams.id, {
                    noteId: source.id,
                    category: source.category,
                });
                updateItemInCollection(modalParams.id, optimisticCollectionItem.id, response);
            } catch (error: any) {
                deleteItemFromCollection(modalParams.id, optimisticCollectionItem.id);
                toast({
                    title: "Failed to add item to collection",
                    description: error.message ?? "An error occurred",
                    variant: "destructive",
                });
            }
        })();
    }

    return (
        <>
            <CommandInput
                placeholder="Search for content in this profile"
                onValueChange={setQuery}
                value={query}
                onKeyDown={handleKeyDown}
            />
            <CommandList>
                <CommandEmpty>No results found</CommandEmpty>
                {result?.content && result.content.length > 0 && (
                    <CommandGroup heading={GroupHeading} className="pb-2">
                        {result?.content.map(({ source }) => (
                            <CommandItem
                                key={source.id}
                                asChild
                                className="p-2 cursor-pointer"
                            >
                                <Button
                                    className="flex items-center justify-between w-full"
                                    variant="ghost"
                                    onClick={() => handleItemClick(source)}
                                >
                                    <div className="text-md">{source.title}</div>
                                    <Badge>
                                        {
                                            contentCategoryLabels.find(
                                                (cat) =>
                                                    cat.value ===
                                                    source.category
                                            )?.label
                                        }
                                    </Badge>
                                </Button>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </>
    );
}
