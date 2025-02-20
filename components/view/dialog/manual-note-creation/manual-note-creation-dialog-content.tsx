"use client";

import { Button } from "@/components/ui/button";
import ContentCategoryIcon from "@/components/ui/content-category-icon";
import {
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { localizeContentCategory } from "@/lib/localize-types";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { CONTENT_CATEGORIES, ContentCategory } from "@/utils/api/types";
import React from "react";

export default function ManualNoteCreationDialogContent() {
    const { openModal } = useModalStore((state) => state);

    const handleClick = (category: ContentCategory) => {
        switch (category) {
            case "games":
                openModal(ModalType.GameNoteCreator);
                break;
            case "movies":
                openModal(ModalType.MovieNoteCreator);
                break;
            default:
                break;
        }
    }

    const isDisabled = (category: ContentCategory) => {
        switch (category) {
            case "games":
            case "movies":
                return false;
            default:
                return true;
        }
    }

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>
                        Manual content creation
                    </DialogTitle>
                </DialogHeader>
            </div>

            <div className="grid gap-4">
                <h2 className="text-lg font-bold text-center">
                    What do you want to add to your profile?
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {CONTENT_CATEGORIES.map(category => (
                        <Button
                            key={category}
                            variant="secondary"
                            size='lg'
                            className="text-md"
                            onClick={() => handleClick(category)} disabled={isDisabled(category)}
                        >
                            <ContentCategoryIcon category={category} className="w-6 h-6" />
                            {localizeContentCategory(category)}
                        </Button>
                    ))}
                </div>
            </div>
        </>
    );
}
