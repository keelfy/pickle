"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import { useOrderModal } from "./order-modal-context";

const SearchModal = () => {
    const { currentModal, closeModal } = useOrderModal();

    if (currentModal != "search") {
        return;
    }

    return (
        <Dialog open={currentModal == "search"} onOpenChange={closeModal}>
            <DialogContent className="p-0 flex flex-col gap-0">
                <DialogHeader className="p-0 h-12">
                    <DialogTitle>
                        <div className="flex h-12 items-center gap-1 ml-4 mr-8">
                            <Search className="text-muted-foreground w-6 h-6" />
                            <Input
                                id="search"
                                placeholder="Bladerunner?"
                                className="border-0 focus-visible:ring-transparent focus-visible:outline-none focus-visible:border-0"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        closeModal();
                                    }
                                }}
                            />
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <Separator />
                <div className="p-6 pt-4 flex flex-col gap-2">
                    <div>Result 1</div>
                    <div>Result 2</div>
                    <div>Result 3</div>
                    <div>Result 4</div>
                    <div>Result 5</div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SearchModal;
