"use client";

import { Button } from "@/components/ui/button";
import ContentCategoryIcon from "@/components/ui/content-category-icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchDeleteCollectionItem } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { localizeContentCategory } from "@/lib/localize-types";
import { CollectionItem } from "@/utils/api/types";
import { TrashIcon } from "lucide-react";
import React from "react";
import { useCollectionContext } from "../../content-collections/collections-context";

type Props = {
    item: CollectionItem;
}

export default function EditCollectionDialogItem({ item }: Props) {
    const [isDeleting, startTransition] = React.useTransition();
    const { states, deleteItemFromCollection, addItemToCollection } = useCollectionContext();

    const onDeleteItem = (itemId: string) => {
        if (!states.length) return;

        startTransition(async () => {
            const deletedItem = states.find((state) => state.collection.id === item.collectionId)?.content.find((item) => item.id === itemId);
            if (!deletedItem) return;
            deleteItemFromCollection(item.collectionId, deletedItem.id);

            try {
                await fetchDeleteCollectionItem(item.collectionId, itemId);
            } catch (error: any) {
                addItemToCollection(item.collectionId, deletedItem);
                toast({
                    title: "Error while deleting item",
                    description: error.message ?? "Please try again",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <TooltipProvider>
            <div className="flex">
                <Tooltip>
                    <TooltipTrigger className="flex-1 flex items-center px-3 border rounded-md rounded-r-none w-full" asChild>
                        <div className="flex items-center gap-2">
                            <ContentCategoryIcon category={item.content.category} className="w-4 h-4" />
                            <p className="text-sm">{item.content.name}</p>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                        <p>{localizeContentCategory(item.content.category, false)}</p>
                    </TooltipContent>
                </Tooltip>
                <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => onDeleteItem(item.id)}
                    disabled={isDeleting}
                    type="button"
                >
                    <TrashIcon />
                    <span className="sr-only">Delete item</span>
                </Button>
            </div>
        </TooltipProvider>
    )
}
