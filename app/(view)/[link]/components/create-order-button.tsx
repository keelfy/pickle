"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useOrderModal } from "../order-modal-context";

export default function CreateOrderButton() {
    const { openModal } = useOrderModal();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => openModal("create", null)}
        >
            <Plus />
        </Button>
    );
}
