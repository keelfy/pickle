"use client";

import { Button } from "@/components/ui/button";
import {
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { fetchRenameNote } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { localizeContentCategory } from "@/lib/localize-types";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ContentCategory } from "@/utils/api/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaselineIcon, Check, CircleOffIcon, X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    name: z.string()
        .min(1, { message: "Name is required" })
        .max(100, { message: "Name must be less than 100 characters" }),
});

type Props = {
    category: ContentCategory;
}

export default function EditCollectionDialogContent({ category }: Props) {
    const { modalParams, closeModal } = useModalStore((state) => state);
    const [isLoading, startTransition] = React.useTransition();
    const profile = useProfileStore((state) => state.profile);

    const { id, name } = modalParams!;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: name ?? "Untitled collection",
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        startTransition(async () => {
            try {
                await fetchRenameNote(profile, category, id, data.name);
                closeModal();
                toast({
                    title: data.name,
                    description: "Content renamed successfully",
                });
            } catch (error: any) {
                toast({
                    title: "Error while renaming content",
                    description: error.message ?? "Please try again",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {name}
                </DialogTitle>
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
                                    Name of the {localizeContentCategory(category)}
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Far Cry 3" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
                        <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
                            {isLoading ? <LoadingSpinner /> : <Check />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </>
    );
}
