"use client";

import { Button } from "../button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../dropdown-menu";
import { EllipsisIcon, Settings2Icon, TextIcon, TrashIcon } from "lucide-react";
import { PencilLineIcon } from "lucide-react";
import { ContentCategory, ContentNote } from "@/utils/api/types";
import { useProfileStore } from "@/providers/profile-store";
import { useModalStore } from "@/providers/modal";
import { ModalType } from "@/stores/modal";

type Props = {
    contentNote: ContentNote;
    category: ContentCategory;
}

export default function ContentNoteCardControls({ contentNote, category }: Props) {
    const profile = useProfileStore(state => state.profile);
    const openModal = useModalStore(state => state.openModal);

    const openGameNote = () => {
        switch (category) {
            case "games":
                openModal(ModalType.GameNote, { id: contentNote.id });
                break;
            case "movies":
                openModal(ModalType.MovieNote, { id: contentNote.id });
                break;
        }
    };

    const openGameNoteEditor = () => {
        switch (category) {
            case "games":
                openModal(ModalType.GameNoteEditor, { id: contentNote.id });
                break;
            case "movies":
                openModal(ModalType.MovieNoteEditor, { id: contentNote.id });
                break;
        }
    };

    const onDelete = () => openModal(ModalType.DeleteContentAlert, {
        category: category,
        title: contentNote.name,
        id: contentNote.id,
    });

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={openGameNote}>
                <TextIcon />
                Details
            </Button>
            {profile.isAuthorized && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost">
                            <EllipsisIcon />
                            Options
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem className="cursor-pointer" onClick={openGameNoteEditor}>
                            <Settings2Icon />
                            Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="cursor-not-allowed text-muted-foreground">
                            <TextIcon />
                            Add to collection
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={onDelete}>
                            <TrashIcon className="text-destructive" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}
