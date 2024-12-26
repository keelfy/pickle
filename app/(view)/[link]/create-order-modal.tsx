"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/utils/api/client";
import { orderCategories, paymentTypes } from "@/utils/api/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Dice5, X } from "lucide-react";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ApiTypePopoverCommandFormItem from "../../../components/ui/api-type-popover-command";
import { useOrderModal } from "./order-modal-context";

// request.CreateOrderReq
const formSchema = z.object({
    receiverLink: z.string(),
    paymentType: z.number(),
    amount: z.number(),
    ordererUsername: z.string(),
    categoryType: z.number(),
    message: z.string(),
});

type Props = {
    link: string;
};

const CreateOrderModal = ({ link }: Props) => {
    const { currentModal, closeModal } = useOrderModal();
    const { toast } = useToast();
    const [isLoading, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            receiverLink: link,
            paymentType: 0,
            amount: 0,
            ordererUsername: "",
            categoryType: 0,
            message: "",
        },
    });

    useEffect(() => {
        if (link) {
            form.setValue("receiverLink", link);
        }
    }, [link]);

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        startTransition(async () => {
            try {
                await fetchWithAuth("/v1/orders", {
                    method: "POST",
                    body: JSON.stringify(data),
                });
                closeModal();
            } catch (error: any) {
                toast({
                    title: "Error while creating order",
                    description: error.message ?? "Please try again",
                });
            }
        });
    };

    const randomize = () =>
        startTransition(async () => {
            await Promise.all([
                form.setValue("amount", Math.floor(Math.random() * 10000)),
                form.setValue(
                    "paymentType",
                    paymentTypes[
                        Math.floor(Math.random() * paymentTypes.length)
                    ].idx
                ),
                form.setValue(
                    "categoryType",
                    orderCategories[
                        Math.floor(Math.random() * orderCategories.length)
                    ].idx
                ),
                fetch("https://randomuser.me/api/")
                    .then((res) => res.json())
                    .then((data) =>
                        form.setValue(
                            "ordererUsername",
                            data.results[0].login.username
                        )
                    ),
                fetch("https://fakerapi.it/api/v1/texts?_quantity=1")
                    .then((res) => res.json())
                    .then((data) =>
                        form.setValue("message", data.data[0].title)
                    ),
            ]);
        });

    if (currentModal !== "create") {
        return null;
    }

    return (
        <Dialog open={currentModal === "create"} onOpenChange={closeModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Suggestion</DialogTitle>
                    <DialogDescription>Manual order creation</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="space-y-6">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Receiver of the Order</Label>
                                <FormField
                                    control={form.control}
                                    name="receiverLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Input
                                                placeholder="Link"
                                                {...field}
                                                readOnly
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Orderer</Label>
                                <FormField
                                    control={form.control}
                                    name="ordererUsername"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Input
                                                placeholder="Username"
                                                {...field}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Payment Type</Label>
                                <FormField
                                    control={form.control}
                                    name="paymentType"
                                    render={({ field }) => (
                                        <ApiTypePopoverCommandFormItem
                                            entries={paymentTypes}
                                            value={field.value}
                                            onChange={(selectedValue) => {
                                                form.setValue(
                                                    "paymentType",
                                                    selectedValue
                                                );
                                                form.setFocus("paymentType");
                                            }}
                                            placeholder="Select payment type..."
                                            nothingFound="No payment types found"
                                        />
                                    )}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Amount</Label>
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Input
                                                placeholder="Amount"
                                                type="number"
                                                {...field}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Category</Label>
                                <FormField
                                    control={form.control}
                                    name="categoryType"
                                    render={({ field }) => (
                                        <ApiTypePopoverCommandFormItem
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
                                    )}
                                />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label>Message</Label>
                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Input
                                                placeholder="Message"
                                                {...field}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter className="mt-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={randomize}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <LoadingSpinner /> : <Dice5 />}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={closeModal}
                                    type="button"
                                    disabled={isLoading}
                                >
                                    <X />
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <LoadingSpinner /> : <Check />}
                                    Confirm
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOrderModal;
