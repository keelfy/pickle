"use client";

import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useEffect } from "react";
import { useOrderModal } from "./order-modal-context";
import { orderCategories } from "@/utils/api/constants";
import OrderCategoryCommand from "./components/order-category-command";

const ApproveModal = () => {
    const { currentModal, order, openModal, closeModal } = useOrderModal();
    const [open, setOpen] = React.useState(false);
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [value, setValue] = React.useState<number>(0);

    useEffect(() => {
        setValue(order?.categoryType ?? 0);
    }, [order?.id]);

    useEffect(() => {
        setOpen(false);
        setDetailsOpen(false);
    }, [currentModal]);

    if (currentModal !== "approve" || !order) {
        return null;
    }

    return (
        <Dialog open={currentModal === "approve"} onOpenChange={closeModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve the order</DialogTitle>
                    <DialogDescription>
                        You can change the details before continuing.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="subject">Category</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-[200px] justify-between"
                            >
                                {value
                                    ? orderCategories.find(
                                          (category) => category.idx === value
                                      )?.label
                                    : "Select category..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <OrderCategoryCommand
                                value={value}
                                onSelect={(currentValue) => {
                                    setValue(
                                        currentValue === value
                                            ? 0
                                            : currentValue
                                    );
                                    setOpen(false);
                                }}
                                getLabel={(category) => category.label}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="subject">Name</Label>
                    <Input defaultValue={order.message} />
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
                            <Button variant="ghost" size="sm">
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
                                {new Date(order.createdAt).toLocaleString()}
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
                    <Button variant="secondary" onClick={closeModal}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() =>
                            openModal("interactive-game-editor", order)
                        }
                    >
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ApproveModal;
