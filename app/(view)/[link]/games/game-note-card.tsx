"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import { fetchApi } from "@/utils/api/client";
import { History, ImageOff, TextIcon, UserPlus2 } from "lucide-react";
import Image from "next/image";
import React from "react";
import GameNoteStatusBadge from "./game-note-status-badge";

export default function GameNoteCard({ note }: { note: GameNote }) {
    const profile = useProfileStore((state) => state.profile);
    const openModal = useModalStore((state) => state.openModal);
    const [posterUrl, setPosterUrl] = React.useState<string>();

    React.useEffect(() => {
        if (note) {
            (async () => {
                try {
                    const res = await fetchApi<any>(
                        `/v1/game-notes/${note.id}/posters?size=sm`,
                        true
                    );
                    setPosterUrl(res.url);
                } catch (error: any) {
                    console.error(error);
                    setPosterUrl(undefined);
                }
            })();
        }
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
                                            {note.createdAt
                                                ? "randombird1213"
                                                : "N/A"}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-min"
                            onClick={openGameNote}
                        >
                            <TextIcon />
                            Details
                        </Button>
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
                            {profile?.username}`s rating
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4 text-sm rounded-md bg-primary-foreground h-min w-full">
                {note.comment && note.comment.length > 0 ? (
                    note.comment
                ) : (
                    <span className="text-muted-foreground">
                        keelfy hasn't left a comment yet.
                    </span>
                )}
            </div>
        </div>
    );
}
