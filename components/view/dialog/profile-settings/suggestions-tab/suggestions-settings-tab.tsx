"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ContentCategoryIcon from "@/components/ui/content-category-icon";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateSuggestionPreferences } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { contentCategoryLabels } from "@/utils/api/constants";
import { CONTENT_CATEGORIES, ContentCategory } from "@/utils/api/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, CircleOffIcon, Loader2Icon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    enabled: z.boolean(),
    allowedFree: z.boolean(),
    allowedAnonymously: z.boolean(),
    categories: z.array(z.custom<ContentCategory>())
        .min(1, { message: "At least one category is required" }),
}).refine((data) => {
    return data.categories.every(category => CONTENT_CATEGORIES.includes(category as ContentCategory));
}, {
    message: "Invalid category",
    path: ["categories"],
});

export default function SuggestionsSettingsTab() {
    const { profile: myProfile, updateProfile: updateMyProfile } = useAuthStore((state) => state);

    const [isLoading, startTransition] = React.useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            enabled: myProfile?.suggestionPreferences?.enabled ?? false,
            allowedFree: myProfile?.suggestionPreferences?.allowedFree ?? true,
            allowedAnonymously: myProfile?.suggestionPreferences?.allowedAnonymously ?? true,
            categories: myProfile?.suggestionPreferences?.categories ?? CONTENT_CATEGORIES,
        },
    });

    const isEnabled = form.watch("enabled");

    const onSubmit = async (data: z.infer<typeof formSchema>) => startTransition(async () => {
        if (!myProfile?.id) return;
        try {
            await updateSuggestionPreferences({
                ...data,
                categories: data.categories as ContentCategory[],
            });
            updateMyProfile({
                ...myProfile,
                suggestionPreferences: {
                    ...myProfile?.suggestionPreferences,
                    ...data,
                    categories: data.categories as ContentCategory[],
                },
            });
            form.reset(data);
        } catch (error: any) {
            toast({
                title: "Failed to update suggestion preferences",
                description: error.message ?? "An unknown error occurred",
                variant: "destructive",
            });
        }
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6 w-full">
                    <FormField
                        control={form.control}
                        name="enabled"
                        render={({ field }) => (
                            <FormItem className="flex space-x-3 space-y-0 w-full">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Receive suggestions
                                    </FormLabel>
                                    <FormDescription>
                                        Allow other users to suggest content to you.
                                    </FormDescription>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="allowedFree"
                        render={({ field }) => (
                            <FormItem className="flex space-x-3 space-y-0 w-full">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={!isEnabled}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Allow free suggestions
                                    </FormLabel>
                                    <FormDescription>
                                        This will allow other users to suggest content to you without making a donation.
                                    </FormDescription>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="allowedAnonymously"
                        render={({ field }) => (
                            <FormItem className="flex space-x-3 space-y-0 w-full">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={!isEnabled}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Allow anonymous suggestions
                                    </FormLabel>
                                    <FormDescription>
                                        This will allow other users to suggest content to you anonymously.
                                    </FormDescription>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="categories"
                        render={({ field }) => (
                            <FormItem className="flex flex-col space-y-3 w-full">
                                <div>
                                    <FormLabel className="text-lg font-semibold">Allowed categories</FormLabel>
                                    <FormDescription>
                                        Select the categories you want to receive suggestions for.
                                    </FormDescription>
                                </div>
                                <div className="grid grid-cols-3 gap-2 ml-2">
                                    {CONTENT_CATEGORIES.map(category => (
                                        <div key={category} className="flex items-center gap-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value.includes(category)}
                                                    onCheckedChange={() => {
                                                        field.onChange(field.value.includes(category) ? field.value.filter(c => c !== category) : [...field.value, category]);
                                                    }}
                                                    disabled={!isEnabled}
                                                />
                                            </FormControl>
                                            <ContentCategoryIcon category={category} className={cn("w-4 h-4", !isEnabled && "opacity-50")} />
                                            <Label className={cn("text-sm", !isEnabled && "opacity-50")}>{contentCategoryLabels.find(c => c.value === category)?.label}</Label>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 w-full">
                        <Button type="reset" variant="outline" disabled={isLoading || !form.formState.isDirty}>
                            <CircleOffIcon />
                            Reset
                        </Button>
                        <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
                            {isLoading ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
                            Confirm
                        </Button>
                    </div>
                </div>
            </form>
        </Form >
    );
}
