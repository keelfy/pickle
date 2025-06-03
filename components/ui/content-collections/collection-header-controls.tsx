"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import { Collection } from "@/utils/api/types";
import { ChevronDownIcon, PencilIcon, TrashIcon } from "lucide-react";
import { DeleteCollectionAlertModalParams } from "../../view/dialog/delete-collection-alert/delete-collection-alert-dialog";
import { EditCollectionModalParams } from "../../view/dialog/edit-collection/edit-collection-dialog";

type Props = {
    toggleCollapsed: () => void;
    collapsed: boolean;
    collection: Collection;
}

export default function CollectionHeaderControls({ toggleCollapsed, collapsed, collection }: Props) {
    const profile = useProfileStore((state) => state.profile);
    const openModal = useModalStore((state) => state.openModal);

    const handleDeleteClick = () => {
        const params: DeleteCollectionAlertModalParams = {
            id: collection.id,
            name: collection.name,
        }
        openModal(ModalType.DeleteCollectionAlert, params);
    }

    const handleEditClick = () => {
        const params: EditCollectionModalParams = {
            id: collection.id,
        }
        openModal(ModalType.EditCollection, params);
    }

    return (
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleCollapsed}>
                <ChevronDownIcon className={cn("transition-transform duration-300", collapsed && "rotate-90")} />
            </Button>
            {profile?.isAuthorized && (
                <>
                    <Button variant="ghost" size="icon" onClick={handleEditClick}>
                        <PencilIcon />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDeleteClick}>
                        <TrashIcon />
                    </Button>
                </>
            )}
        </div>
    )
}
