"use client";

import ApiTypeComboboxFormControl from "@/components/ui/api-type-combobox-form-control";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/providers/modal";
import { useOrderStore } from "@/providers/order";
import { orderCategories } from "@/utils/api/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    categoryType: z.number(),
    message: z.string(),
});

const ApproveModal = () => {
    const { currentModal, openModal, closeModal } = useModalStore(
        (state) => state
    );
    const { order, setOrder } = useOrderStore((state) => state);

    const [detailsOpen, setDetailsOpen] = React.useState<boolean>(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            categoryType: 0,
            message: "",
        },
    });

    React.useEffect(() => {
        if (order) {
            form.reset({
                categoryType: order.categoryType ?? 0,
                message: order.message ?? "",
            });
        } else {
            form.reset();
        }
    }, [order?.id]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!order) {
            onCancel();
            return;
        }

        setOrder({
            ...order,
            categoryType: values.categoryType,
            message: values.message,
        });
        openModal("interactive-game-editor");
    }

    function onCancel() {
        setOrder(undefined);
        closeModal();
    }

    if (currentModal !== "approve" || !order) {
        return null;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Dialog
                    open={currentModal === "approve"}
                    onOpenChange={closeModal}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve the order</DialogTitle>
                            <DialogDescription>
                                You can change the details before continuing.
                            </DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="categoryType"
                            render={({ field }) => (
                                <FormItem className="flex flex-col gap-1">
                                    <FormLabel htmlFor="categoryType">
                                        Category
                                    </FormLabel>
                                    <ApiTypeComboboxFormControl
                                        entries={orderCategories}
                                        value={field.value}
                                        onChange={(selectedValue) => {
                                            form.setValue(
                                                "categoryType",
                                                selectedValue
                                            );
                                            form.setFocus("categoryType");
                                        }}
                                        placeholder="Select category..."
                                        nothingFound="No categories found"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="message">
                                        Message
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                    >
                                        <ChevronsUpDown className="h-4 w-4" />
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="space-y-4">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label>Orderer Username</Label>
                                    <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                                        {order.ordererUsername}
                                    </div>
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label>Date of the order</Label>
                                    <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                                        {new Date(
                                            order.createdAt
                                        ).toLocaleString()}
                                    </div>
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label>Amount</Label>
                                    <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                                        {order.amount}
                                    </div>
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label>Currency</Label>
                                    <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
                                        {order.paymentType}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <DialogFooter>
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={onCancel}
                            >
                                <X />
                                Cancel
                            </Button>
                            <Button type="submit">
                                <Check />
                                Continue
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </form>
        </Form>
    );
};

export default ApproveModal;
