"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DeleteContentType } from "@/components/view/dialog/delete-content-alert/delete-content-alert-dialog";
import { createGameNoteReaction, deleteGameNoteReaction, fetchGameNotePoster, fetchGameNoteReactions } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import { EmojiPicker } from "@ferrucc-io/emoji-picker";
import {
    EditIcon,
    History,
    ImageOff,
    PlusIcon,
    TextIcon,
    UserPlus2,
    X
} from "lucide-react";
import Image from "next/image";
import React from "react";
import GameNoteStatusBadge from "./game-note-status-badge";
import useRedirectToLogin from "@/hooks/use-redirect-to-login";

type Props = {
    note: GameNote;
}

export default function GameNoteCard({ note }: Props) {
    const user = useAuthStore((state) => state.user);
    const profile = useProfileStore((state) => state.profile);
    const openModal = useModalStore((state) => state.openModal);
    const [posterUrl, setPosterUrl] = React.useState<string>();
    const [isCommentExpanded, setCommentIsExpanded] = React.useState(false);

    const redirectToLogin = useRedirectToLogin();

    const [reactions, setReactions] = React.useState<NoteReaction[]>([]);
    const [isReactionsLoading, setIsReactionsLoading] = React.useState(false);
    const [isReactionsChanging, startReactionsChange] = React.useTransition();

    React.useEffect(() => {
        if (note) {
            (async () => {
                try {
                    const res = await fetchGameNotePoster(profile, note.id, 'sm');
                    setPosterUrl(res?.url ?? undefined);
                } catch (error: any) {
                    console.error(error);
                    setPosterUrl(undefined);
                }
            })();
        }
    }, []);

    React.useEffect(() => {
        if (note) {
            (async () => {
                setIsReactionsLoading(true);
                try {
                    const res = await fetchGameNoteReactions(profile, note.id);
                    setReactions(res ?? []);
                } catch (error: any) {
                    console.error(error);
                    setReactions([]);
                } finally {
                    setIsReactionsLoading(false);
                }
            })();
        }
    }, [note]);

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

    const handleEmojiSelect = (emoteId: string) => {
        if (isReactionsChanging) return;
        if (reactions.find((reaction) => reaction.emoteId === emoteId)) {
            return;
        }

        startReactionsChange(async () => {
            try {
                await createGameNoteReaction(profile, note.id, emoteId);
                const sameEmote = reactions.find((reaction) => reaction.emoteId === emoteId);
                if (sameEmote) {
                    sameEmote.count++;
                } else {
                    setReactions([...reactions, { emoteId, source: 'unicode_emoji', count: 1, reactedByUser: true }]);
                }
            } catch (error: any) {
                console.error(error);
                toast({
                    title: "Error adding reaction",
                    description: error.message ?? "An error occurred.",
                });
            }
        });
    }

    const handleEmojiClick = (emoteId: string) => {
        if (!user) {
            redirectToLogin();
            return;
        }

        if (isReactionsChanging) return;
        const reacted = reactions.find((reaction) => reaction.emoteId === emoteId);
        if (!reacted) return;

        if (reacted.reactedByUser) {
            startReactionsChange(async () => {
                try {
                    await deleteGameNoteReaction(profile, note.id, emoteId);
                    if (reacted.count > 1) {
                        reacted.count--;
                        reacted.reactedByUser = false;
                    } else {
                        setReactions(reactions.filter((reaction) => reaction.emoteId !== emoteId));
                    }
                } catch (error: any) {
                    console.error(error);
                }
            });
        } else {
            startReactionsChange(async () => {
                try {
                    await createGameNoteReaction(profile, note.id, emoteId);
                    reacted.reactedByUser = true;
                    reacted.count++;
                } catch (error: any) {
                    console.error(error);
                }
            });
        }
    }

    return (
        <div className="flex flex-col gap-4 shadow rounded-lg p-4 border text-start">
            <div className="flex justify-between gap-4">
                <div className="flex gap-4">
                    <div className="w-[100px] h-[150px]">
                        {posterUrl ? (
                            <Image
                                src={posterUrl}
                                alt="Poster"
                                width={100}
                                height={150}
                                className="rounded-md"
                            />
                        ) : (
                            <label className="flex flex-col items-center justify-center bg-gray-500 dark:bg-gray-800 w-full h-full rounded-md">
                                <ImageOff />
                            </label>
                        )}
                    </div>
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
                                <>
                                    <Button variant="ghost" onClick={openGameNoteEditor}>
                                        <EditIcon />
                                        Edit
                                    </Button>
                                    <Button variant="ghost" onClick={onDelete}>
                                        <X className="text-destructive" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="h-min flex gap-4">
                    <div className="px-2 py-4">
                        <GameNoteStatusBadge status={note.status} />
                    </div>
                    <div className="inline-flex flex-col items-center justify-center px-8 py-6 bg-secondary rounded-lg">
                        <div className={cn("text-3xl font-bold", ratingColor)}>
                            {note.rate ?? "N/A"}
                        </div>
                        <div className="font-semibold whitespace-nowrap">
                            rating
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4 text-sm rounded-md bg-primary-foreground h-min w-full">
                {note.comment && note.comment.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        <div className={cn(
                            "whitespace-pre-wrap",
                            !isCommentExpanded && "line-clamp-3"
                        )}>
                            {note.comment}
                        </div>
                        {note.comment.split('\n').length > 3 && (
                            <Button
                                variant="ghost"
                                className="w-fit"
                                onClick={() => setCommentIsExpanded(!isCommentExpanded)}
                            >
                                {isCommentExpanded ? 'Show less' : 'View more'}
                            </Button>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground">
                        keelfy hasn't left a comment yet.
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {reactions.map((reaction) => (
                    <Button
                        key={reaction.emoteId}
                        className="rounded-xl px-2 py-1 h-7"
                        onClick={() => handleEmojiClick(reaction.emoteId)}
                        variant={reaction.reactedByUser ? "default" : "secondary"}
                    >
                        <div className="flex items-center gap-1">
                            <div className="text-sm">
                                {reaction.emoteId}
                            </div>
                            <div className="text-md font-semibold">
                                {reaction.count}
                            </div>
                        </div>
                    </Button>
                ))}
                {user && (
                    <Popover>
                        <PopoverTrigger>
                            <div className="border rounded-xl px-2 py-1 h-7 flex items-center justify-center">
                                +
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-fit p-0">
                            <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                                <EmojiPicker.Header>
                                    <EmojiPicker.Input placeholder="Search emoji" />
                                </EmojiPicker.Header>
                                <EmojiPicker.Group>
                                    <EmojiPicker.List />
                                </EmojiPicker.Group>
                            </EmojiPicker>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </div>
    );
}
