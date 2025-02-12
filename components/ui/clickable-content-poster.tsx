"use client";

import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";
import { Content } from "@/utils/api/types";
import { GameNoteDialogParams } from "../view/dialog/game-note/game-note-dialog";
import ContentPoster from "./content-poster";

type Props = {
    posterUrl: string | undefined;
    size?: "sm" | "md" | "lg";
    className?: string;
    loading?: boolean;
    alt?: string;
    content: Content;
    ref?: React.RefObject<HTMLButtonElement>;
}

export default function ClickableContentPoster({ posterUrl, size = "sm", className, loading = false, content, alt, ref }: Props) {
    const openModal = useModalStore(state => state.openModal);

    const handleClick = () => {
        switch (content.category) {
            case 'games':
                const params: GameNoteDialogParams = {
                    id: content.id,
                }
                openModal(ModalType.GameNote, params);
                break;
        }
    }

    return (
        <button
            ref={ref}
            onClick={handleClick}
            className={cn("border-none p-0 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-md", className)}
        >
            <ContentPoster
                posterUrl={posterUrl}
                size={size}
                loading={loading}
                className="cursor-pointer"
                alt={alt}
            />
        </button>
    )
}
