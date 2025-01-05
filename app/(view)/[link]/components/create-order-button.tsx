"use client";

import { Button } from "@/components/ui/button";
import { useModalStore } from "@/providers/modal";
import { Plus } from "lucide-react";

export default function CreateOrderButton() {
    const { openModal } = useModalStore((state) => state);

    return (
        <Button variant="ghost" size="icon" onClick={() => openModal("create")}>
            <Plus />
        </Button>
    );
}
