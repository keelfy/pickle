"use client";

import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { ContentCategory, ContentNote } from "@/utils/api/types";
import { GameNoteDialogParams } from "../../view/dialog/game-note/game-note-dialog";
import ContentNotePoster from "./content-note-poster";
import { MovieNoteDialogParams } from "@/components/view/dialog/movie-note/movie-note-dialog";

type Props = {
    content: ContentNote;
    category: ContentCategory;
    size?: "sm" | "md" | "lg";
    className?: string;
    loading?: boolean;
    alt?: string;
}

export default function ContentNoteClickablePoster({ size = "sm", className, loading = false, content, category, alt }: Props) {
    const openModal = useModalStore(state => state.openModal);

    const handleClick = () => {
        switch (category) {
            case 'games':
                const gameParams: GameNoteDialogParams = {
                    noteId: content.id,
                }
                openModal(ModalType.GameNote, gameParams);
                break;
            case 'movies':
                const movieParams: MovieNoteDialogParams = {
                    noteId: content.id,
                }
                openModal(ModalType.MovieNote, movieParams);
                break;
        }
    }

    return (
        <button
            onClick={handleClick}
            className={cn("border-none p-0 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-md", className)}
        >
            <ContentNotePoster
                posterUrl={content.coverUrl?.replace("t_thumb", "t_cover_big")}
                size={size}
                loading={loading}
                className="cursor-pointer"
                alt={alt}
            />
        </button>
    )
}
