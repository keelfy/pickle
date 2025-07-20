"use client";

import ContentCategoryIcon from "@/components/ui/content-category-icon";
import ContentNotePoster from "@/components/ui/content-note/content-note-poster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { localizeContentCategory } from "@/lib/localize-types";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { CollectionItem } from "@/utils/api/types";
import { GameNoteDialogParams } from "../../view/dialog/game-note/game-note-dialog";
import { MovieNoteDialogParams } from "@/components/view/dialog/movie-note/movie-note-dialog";

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
                    noteId: item.content.id,
                }
                openModal(ModalType.GameNote, params);
                break;
            case 'movies':
                const movieParams: MovieNoteDialogParams = {
                    noteId: item.content.id,
                }
                openModal(ModalType.MovieNote, movieParams);
                break;
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleClick}
                        className={cn("border-none p-0", className)}
                    >
                        <div className="flex flex-col gap-1">
                            <ContentNotePoster
                                posterUrl={item.coverUrl}
                                size="sm"
                                className="cursor-pointer shadow-sm hover:shadow-2xl hover:scale-105 transition-all duration-300"
                            />
                            <div className="flex flex-col text-start whitespace-normal">
                                <p className="text-xs max-w-[100px] line-clamp-2 whitespace-normal hover:underline underline-offset-2">
                                    {item.content.title}
                                </p>
                                <p className="text-[0.7rem] text-muted-foreground">
                                    {localizeContentCategory(item.content.category)}
                                </p>
                            </div>
                        </div>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <div className="flex items-center gap-1">
                        <ContentCategoryIcon category={item.content.category} className="w-4 h-4" />
                        <p>
                            {item.content.title}
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}