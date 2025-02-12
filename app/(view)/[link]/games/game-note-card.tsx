"use client";

import { Button } from "@/components/ui/button";
import ClickableContentPoster from "@/components/ui/clickable-content-poster";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteContentType } from "@/components/view/dialog/delete-content-alert/delete-content-alert-dialog";
import { fetchGameNotePoster } from "@/hooks/api-endpoints-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import { GameNote, Reaction } from "@/utils/api/types";
import {
    EllipsisIcon,
    History,
    PencilIcon,
    TextIcon,
    TrashIcon,
    UserPlus2
} from "lucide-react";
import React from "react";
import GameNoteReactions from "./game-note-reactions";
import GameNoteStatusBadge from "./game-note-status-badge";
import NoteComment from "./note-comment";

type Props = {
    note: GameNote;
    defaultReactions?: Reaction[];
}

export default function GameNoteCard({ note, defaultReactions }: Props) {
    const user = useAuthStore((state) => state.user);
    const profile = useProfileStore((state) => state.profile);
    const openModal = useModalStore((state) => state.openModal);
    const [posterUrl, setPosterUrl] = React.useState<string>();
    const [isPosterLoading, startTransition] = React.useTransition();

    React.useEffect(() => {
        if (!note || !profile?.id) {
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetchGameNotePoster(profile, note.id, 'sm');
                setPosterUrl(res?.url ?? undefined);
            } catch (error: any) {
                console.error(error);
                setPosterUrl(undefined);
            }
        });
    }, []);

    const openGameNote = () => {
        openModal(ModalType.GameNote, { id: note.id });
    };

    const ratingColor = React.useMemo(() => {
        if (!note.rate) {
            return "text-gray-500";
        }

        if (note.rate >= 7) {
            return "text-green-500";
        }

        if (note.rate >= 3) {
            return "text-yellow-500";
        }

        return "text-red-500";
    }, [note.rate]);

    const openGameNoteEditor = () => {
        openModal(ModalType.GameNoteEditor, { id: note.id });
    };

    const onDelete = () =>
        openModal(ModalType.DeleteContentAlert, {
            type: DeleteContentType.GameNote,
            title: note.name,
            id: note.id,
        });

    return (
        <div className="flex flex-col gap-4 shadow rounded-lg p-4 border text-start">
            <div className="flex justify-between gap-4">
                <div className="flex gap-4">
                    <ClickableContentPoster
                        posterUrl={posterUrl}
                        loading={isPosterLoading}
                        content={{
                            id: note.id,
                            name: note.name,
                            category: 'games',
                        }}
                    />
                    <div className="flex-1 flex flex-col gap-1 w-full justify-between">
                        <div className="space-y-1">
                            <div>
                                <span className="font-bold text-md">
                                    {note.name}
                                </span>
                                {note.releaseDate && (
                                    <span className="text-muted-foreground text-sm">
                                        &nbsp;&nbsp;
                                        {new Date(
                                            note.releaseDate
                                        ).getFullYear()}
                                    </span>
                                )}
                            </div>
                            <table>
                                <tbody>
                                    <tr>
                                        <td className="text-sm pt-2 w-32 flex items-center gap-1">
                                            <History size={12} />
                                            Since
                                        </td>
                                        <td className="text-sm pt-2">
                                            {new Date(
                                                note.createdAt
                                            ).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm w-32 flex items-center gap-1">
                                            <UserPlus2 size={12} />
                                            Requester
                                        </td>
                                        <td className="text-sm">
                                            {note.initialOrdererUsername
                                                ? note.initialOrdererUsername
                                                : "N/A"}
                                            <span className="text-muted-foreground text-xs">
                                                {note.ordererCount > 1 && ` + ${note.ordererCount - 1} more`}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={openGameNote}>
                                <TextIcon />
                                Details
                            </Button>
                            {profile?.id === user?.id && user?.id && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost">
                                            <EllipsisIcon />
                                            Options
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem className="cursor-pointer" onClick={openGameNoteEditor}>
                                            <PencilIcon />
                                            Edit
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
                    </div>
                </div>
                <div className="h-min flex gap-4">
                    <div className="px-2 py-4">
                        <GameNoteStatusBadge status={note.status} />
                    </div>
                    <div className="inline-flex flex-col items-center justify-center px-8 py-6 bg-secondary rounded-lg">
                        <div className="text-3xl font-bold text-muted-foreground">
                            {note.rate ? (
                                <p>
                                    <span className={cn("text-3xl font-bold", ratingColor)}>{note.rate}</span>/10
                                </p>
                            ) : "N/A"}
                        </div>
                        <div className="font-semibold whitespace-nowrap">
                            rating
                        </div>
                    </div>
                </div>
            </div>
            <NoteComment comment={note.comment} />
            {defaultReactions && <GameNoteReactions note={note} defaultReactions={defaultReactions} />}
        </div>
    );
}
