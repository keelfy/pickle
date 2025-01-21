"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fetchContentSearch, fetchOrderById, updateOrder } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import { contentCategoryLabels } from "@/utils/api/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { PopoverClose } from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, CircleAlert, CircleOff, X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    category: z.custom<ContentCategory>(),
    message: z.string(),
    contentId: z.string().optional(),
});

export default function ApproveOrderDialogContent() {
    const { openModal, closeModal } = useModalStore((state) => state);
    const { id: orderId } = useModalStore((state) => state.modalParams!);
    const { profile } = useProfileStore((state) => state);
    const [order, setOrder] = React.useState<Order>();

    const [detailsOpen, setDetailsOpen] = React.useState<boolean>(false);

    const [contentSearchResults, setContentSearchResults] =
        React.useState<ContentSearchHits>();

    const [contentQuery, setContentQuery] = React.useState<string>("");

    const [isOrderApproving, startOrderApprovingTransition] =
        React.useTransition();

    const [debouncedContentQuery, setDebouncedContentQuery] =
        React.useState<string>("");

    const [contentSearchPage, setContentSearchPage] = React.useState<number>(0);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: order?.category ?? "custom",
            message: order?.message ?? "",
        },
    });

    const isSearchQueryValid = React.useMemo(
        () =>
            debouncedContentQuery &&
            debouncedContentQuery.length > 2 &&
            debouncedContentQuery.length <= 100,
        [debouncedContentQuery]
    );

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedContentQuery(contentQuery);
        }, 200);

        return () => clearTimeout(timeout);
    }, [contentQuery]);

    React.useEffect(() => {
        setContentSearchPage(0);
    }, [debouncedContentQuery]);

    React.useEffect(() => {
        if (!isSearchQueryValid) {
            setContentSearchResults(undefined);
            return;
        }

        (async () => {
            try {
                const response = await fetchContentSearch(profile, debouncedContentQuery, contentSearchPage, 5);
                setContentSearchResults(response);
            } catch (error: any) {
                toast({
                    title: "Failed to fetch search results",
                    description: error.message ?? "An error occurred",
                });
            }
        })();
    }, [debouncedContentQuery]);

    React.useEffect(() => {
        if (!isSearchQueryValid || contentSearchPage === 0) {
            return;
        }

        (async () => {
            try {
                const response = await fetchContentSearch(profile, debouncedContentQuery, contentSearchPage, 5);

                if (contentSearchResults?.content && response?.content) {
                    setContentSearchResults({
                        ...response,
                        content: [
                            ...contentSearchResults.content,
                            ...response.content,
                        ],
                    });
                } else {
                    setContentSearchResults(response);
                }
            } catch (error: any) {
                toast({
                    title: "Failed to fetch search results",
                    description: error.message ?? "An error occurred",
                });
            }
        })();
    }, [contentSearchPage]);

    React.useEffect(() => {
        if (!orderId) {
            return;
        }

        (async () => {
            try {
                const response = await fetchOrderById(profile, orderId);
                setOrder(response);
            } catch (error: any) {
                toast({
                    title: "Failed to fetch the order",
                    description: error.message ?? "An error occurred",
                });
            }
        })();
    }, [orderId]);

    React.useEffect(() => {
        onReset();
    }, [order?.id]);

    const onReset = () => {
        if (order) {
            form.reset({
                category: order?.category ?? "custom",
                message: order?.message ?? "",
            });
        } else {
            form.reset();
        }
    };

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (!orderId) {
            closeModal();
            return;
        }

        if (values.contentId) {
            switch (values.category) {
                case "games":
                    startOrderApprovingTransition(async () => {
                        try {
                            await updateOrder(profile, orderId, {
                                status: 'approved',
                            });
                            closeModal();
                        } catch (error: any) {
                            toast({
                                title: "Failed to approve the order",
                                description:
                                    error.message ?? "An error occurred",
                            });
                        }
                    });
                    return;
            }
        } else {
            openModal(ModalType.CreateGameNote, {
                orderId: orderId,
                title: values.message,
                orderer: order?.ordererUsername,
                at: order?.createdAt,
            });
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Approve the order</DialogTitle>
                <DialogDescription>
                    You can change the details before continuing.
                </DialogDescription>
            </DialogHeader>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel>Category</FormLabel>
                                <Select
                                    value={field.value.toString()}
                                    onValueChange={(value) => {
                                        if (value) {
                                            form.setValue(
                                                "category",
                                                value as ContentCategory
                                            );
                                            form.setFocus("category");
                                        }
                                    }}
                                    required
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            {contentCategoryLabels.map(
                                                (category) => (
                                                    <SelectItem
                                                        key={category.value}
                                                        value={category.value}
                                                    >
                                                        {category.label}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-2">
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem className="flex flex-col gap-2">
                                    <FormLabel>Title</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value &&
                                                        "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value.length > 50
                                                        ? `${field.value.slice(0, 50)}...`
                                                        : field.value ||
                                                        "Select a content"}
                                                    <ChevronsUpDown className="opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Type to search a content"
                                                    onValueChange={
                                                        setContentQuery
                                                    }
                                                    value={contentQuery}
                                                />
                                                <CommandList>
                                                    <CommandGroup heading="Add a new title">
                                                        <PopoverClose className="w-full">
                                                            <CommandItem
                                                                value={
                                                                    order?.message
                                                                }
                                                                onSelect={() => {
                                                                    form.setValue(
                                                                        "message",
                                                                        order?.message ??
                                                                        ""
                                                                    );
                                                                    form.setFocus(
                                                                        "message"
                                                                    );
                                                                    form.setValue(
                                                                        "contentId",
                                                                        undefined
                                                                    );
                                                                }}
                                                                className="text-start"
                                                            >
                                                                {order?.message}
                                                            </CommandItem>
                                                        </PopoverClose>
                                                        {contentQuery.length >
                                                            0 && (
                                                                <PopoverClose className="w-full">
                                                                    <CommandItem
                                                                        value={
                                                                            contentQuery
                                                                        }
                                                                        onSelect={() => {
                                                                            form.setValue(
                                                                                "message",
                                                                                contentQuery ??
                                                                                ""
                                                                            );
                                                                            form.setFocus(
                                                                                "message"
                                                                            );
                                                                            form.setValue(
                                                                                "contentId",
                                                                                undefined
                                                                            );
                                                                        }}
                                                                        className="text-start"
                                                                    >
                                                                        {
                                                                            contentQuery
                                                                        }
                                                                    </CommandItem>
                                                                </PopoverClose>
                                                            )}
                                                    </CommandGroup>
                                                    <CommandGroup
                                                        heading={
                                                            <>
                                                                Search results
                                                                for
                                                                profile&nbsp;
                                                                <span className="font-bold">
                                                                    {
                                                                        profile?.username
                                                                    }
                                                                </span>
                                                            </>
                                                        }
                                                    >
                                                        {contentSearchResults?.content.map(
                                                            ({ source }) => (
                                                                <PopoverClose
                                                                    className="w-full"
                                                                    key={
                                                                        source.id
                                                                    }
                                                                >
                                                                    <CommandItem
                                                                        value={
                                                                            source.name
                                                                        }
                                                                        onSelect={() => {
                                                                            form.setValue(
                                                                                "message",
                                                                                source.name
                                                                            );
                                                                            form.setValue(
                                                                                "category",
                                                                                source.category
                                                                            );
                                                                            form.setValue(
                                                                                "contentId",
                                                                                source.id
                                                                            );
                                                                            form.setFocus(
                                                                                "message"
                                                                            );
                                                                        }}
                                                                        className="flex items-center justify-between gap-2"
                                                                    >
                                                                        {
                                                                            source.name
                                                                        }
                                                                        <Badge>
                                                                            {
                                                                                contentCategoryLabels.find(
                                                                                    (
                                                                                        category
                                                                                    ) =>
                                                                                        category.value ===
                                                                                        source.category
                                                                                )
                                                                                    ?.label
                                                                            }
                                                                        </Badge>
                                                                    </CommandItem>
                                                                </PopoverClose>
                                                            )
                                                        )}
                                                        {!contentSearchResults && (
                                                            <CommandItem
                                                                className="italic"
                                                                disabled
                                                            >
                                                                ...type anything
                                                                to search
                                                            </CommandItem>
                                                        )}
                                                        {contentSearchResults?.content &&
                                                            contentSearchResults
                                                                .content
                                                                .length ===
                                                            0 && (
                                                                <CommandItem
                                                                    className="italic"
                                                                    disabled
                                                                >
                                                                    ...no
                                                                    results
                                                                    found
                                                                </CommandItem>
                                                            )}
                                                        {contentSearchResults?.content &&
                                                            contentSearchResults
                                                                .content
                                                                .length > 0 &&
                                                            contentSearchResults.totalPages -
                                                            1 >
                                                            contentSearchResults.page && (
                                                                <CommandItem
                                                                    onSelect={() => {
                                                                        setContentSearchPage(
                                                                            contentSearchPage +
                                                                            1
                                                                        );
                                                                    }}
                                                                >
                                                                    -- Show more
                                                                    results --
                                                                </CommandItem>
                                                            )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!form.watch("contentId") && (
                            <div className="flex items-center gap-2 px-2">
                                <CircleAlert
                                    size={16}
                                    className="text-yellow-500"
                                />
                                <span className="text-sm">
                                    A new title will be added to your profile.
                                </span>
                            </div>
                        )}
                    </div>

                    <Collapsible
                        open={detailsOpen}
                        onOpenChange={setDetailsOpen}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between space-x-4">
                            <h4 className="text-md font-semibold">
                                Orderer Details
                            </h4>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" type="button">
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="sr-only">Toggle</span>
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="space-y-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Orderer Username</Label>
                                <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                                    {order?.ordererUsername}
                                </div>
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Date of the order</Label>
                                <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                                    {order?.createdAt
                                        ? new Date(
                                            order?.createdAt
                                        ).toLocaleString()
                                        : "unknown"}
                                </div>
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Amount</Label>
                                <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                                    {order?.amount}
                                </div>
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Currency</Label>
                                <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                                    {order?.paymentType}
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <DialogFooter>
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={closeModal}
                            disabled={isOrderApproving}
                        >
                            <X />
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={onReset}
                            disabled={isOrderApproving}
                        >
                            <CircleOff />
                            Reset
                        </Button>
                        <Button type="submit" disabled={isOrderApproving}>
                            <Check />
                            Continue
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </>
    );
}
