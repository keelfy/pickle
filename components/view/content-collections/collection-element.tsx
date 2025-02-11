"use client";

import ContentPoster from "@/components/ui/content-poster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { CollectionItem } from "@/utils/api/types";
import { GameNoteDialogParams } from "../dialog/game-note/game-note-dialog";

type Props = {
    item: CollectionItem;
    className?: string;
}

export default function CollectionElement({ item, className }: Props) {
    const openModal = useModalStore(state => state.openModal);

    const handleClick = () => {
        switch (item.content.category) {
            case 'games':
                const params: GameNoteDialogParams = {
                    id: item.content.id,
                }
                openModal(ModalType.GameNote, params);
                break;
        }
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleClick}
                        className={cn("border-none p-0 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-md", className)}
                    >
                        <ContentPoster 
                            posterUrl={item.posterUrl}
                            size="sm"
                            className="cursor-pointer"
                            alt={item.content.name}
                        />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>{item.content.name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}