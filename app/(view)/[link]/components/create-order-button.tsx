"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/providers/auth-store";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import { Plus } from "lucide-react";

export default function CreateOrderButton() {
    const authorizedUser = useAuthStore((state) => state.user);
    const { profile } = useProfileStore((state) => state);

    const { openModal } = useModalStore((state) => state);

    const isUserAuthorized =
        profile !== null && authorizedUser?.id == profile?.id;

    if (!isUserAuthorized) {
        return null;
    }

    return (
        <Button variant="ghost" size="icon" onClick={() => openModal(ModalType.CreateOrder)}>
            <Plus />
        </Button>
    );
}
