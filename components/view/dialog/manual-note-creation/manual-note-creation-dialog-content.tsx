"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ContentCategoryIcon from "@/components/ui/content-category-icon";
import {
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { localizeContentCategory } from "@/lib/localize-types";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { CONTENT_CATEGORIES, ContentCategory } from "@/utils/api/types";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import React from "react";

export default function ManualNoteCreationDialogContent() {
    const { openModal } = useModalStore((state) => state);

    const [selectedCategory, setSelectedCategory] = React.useState<ContentCategory>();

    const handleClick = () => {
        switch (selectedCategory) {
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

            <div className="grid gap-6">
                <div className="grid gap-4">
                    <h2 className="text-lg font-bold text-center">
                        What do you want to add to your profile?
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {CONTENT_CATEGORIES.map(category => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "secondary"}
                                size='lg'
                                className="text-md w-full"
                                disabled={isDisabled(category)}
                                onClick={() => setSelectedCategory(prev => prev === category ? undefined : category)}
                            >
                                <ContentCategoryIcon category={category} className="w-6 h-6" />
                                {localizeContentCategory(category)}
                            </Button>
                        ))}
                    </div>
                </div>

                <Collapsible open={!!selectedCategory}>
                    <CollapsibleContent>
                        <div className="grid gap-3">
                            <div className="flex flex-col items-center">
                                <h2 className="text-lg font-bold text-center">
                                    Is it a real {localizeContentCategory(selectedCategory!).toLowerCase()}?
                                </h2>
                                <p className="text-muted-foreground text-center text-sm">
                                    You can auto-fill metadata (poster, release date, etc.).
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="default" className="w-full" disabled>
                                    <SearchIcon />
                                    <p>Search in <span className="font-bold">{selectedCategory === "games" ? "IGDB" : "TMDB"}</span></p>
                                </Button>

                                <div className="flex flex-col items-center">
                                    <p className="text-muted-foreground text-center text-sm">or</p>
                                </div>

                                <Button variant="secondary" className="w-full" onClick={handleClick}>
                                    <p>Fill the card manually</p>
                                    <ArrowRightIcon />
                                </Button>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </>
    );
}
