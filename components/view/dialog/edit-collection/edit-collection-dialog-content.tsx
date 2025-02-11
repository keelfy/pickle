"use client";

import { Button } from "@/components/ui/button";
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { fetchUpdateCollection } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaselineIcon, Check, CircleOffIcon, LibraryIcon, X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCollectionContext } from "../../content-collections/collections-context";
import EditCollectionDialogItem from "./edit-collection-dialog-item";
import EditCollectionDialogLoadMoreItems from "./edit-collection-dialog-load-more-items";

const formSchema = z.object({
    name: z.string()
        .min(1, { message: "Name is required" })
        .max(50, { message: "Name must be less than 50 characters" }),
});

export default function EditCollectionDialogContent() {
    const { modalParams, closeModal } = useModalStore((state) => state);
    const [isLoading, startTransition] = React.useTransition();
    const { states: collectionStates, updateCollection } = useCollectionContext();

    const collectionState = React.useMemo(() => {
        return collectionStates.find((state) => state.collection.id === modalParams?.id);
    }, [collectionStates, modalParams?.id]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: collectionState?.collection.name ?? "Untitled collection",
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        const updatedCollection = collectionState?.collection;
        if (!updatedCollection?.id) return;

        startTransition(async () => {
            const optimisticCollection = {
                ...updatedCollection,
                name: data.name,
            };
            updateCollection(optimisticCollection.id, optimisticCollection);

            try {
                const newCollection = await fetchUpdateCollection(updatedCollection.id, data);
                updateCollection(optimisticCollection.id, newCollection);
                closeModal();
                toast({
                    title: data.name,
                    description: "Collection updated successfully",
                });
            } catch (error: any) {
                updateCollection(optimisticCollection.id, updatedCollection);
                toast({
                    title: "Error while updating collection",
                    description: error.message ?? "Please try again",
                    variant: "destructive",
                });
            }
        });
    };

    if (!collectionState) return null;

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {collectionState?.collection.name}
                </DialogTitle>
                <DialogDescription>You can use collections to organize your content the way you want.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1">
                                    <BaselineIcon className="w-4 h-4" />
                                    Name
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. My favorite games" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col gap-2 w-full mt-4">
                        <div className="flex items-center gap-2">
                            <LibraryIcon className="w-4 h-4" />
                            <Label>Items</Label>
                        </div>
                        {collectionState.content.map((item) => (
                            <EditCollectionDialogItem key={item.id} item={item} />
                        ))}
                        {(collectionState.page < collectionState.totalPages - 1) && (
                            <EditCollectionDialogLoadMoreItems collectionId={collectionState.collection.id} />
                        )}
                        <FormDescription>
                            Note that item deletion does not require confirmation and will be instantly applied.
                        </FormDescription>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            variant="destructive"
                            onClick={closeModal}
                            type="button"
                            disabled={isLoading}
                        >
                            <X />
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => form.reset()}
                            type="button"
                            disabled={isLoading || !form.formState.isDirty}
                        >
                            <CircleOffIcon />
                            Reset
                        </Button>
                        <Button type="submit" disabled={isLoading || !form.formState.isDirty || !form.formState.isValid}>
                            {isLoading ? <LoadingSpinner /> : <Check />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </>
    );
}
