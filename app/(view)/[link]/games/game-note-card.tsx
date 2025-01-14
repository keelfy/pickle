"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { useModalStore } from "@/providers/modal";
import { useNoteStore } from "@/providers/note-store";
import { useProfileStore } from "@/providers/profile-store";
import { gameNoteStatusLabels } from "@/utils/api/constants";
import {
    CheckCheck,
    FastForward,
    ImageOff,
    Loader,
    Pause,
    TextIcon
} from "lucide-react";
import React from "react";

export default function GameNoteCard({ note }: { note: GameNote }) {
    const { profile } = useProfileStore((state) => state);
    const { user } = useAuthStore((state) => state);
    const { openModal } = useModalStore((state) => state);
    const { setShortNote } = useNoteStore((state) => state);

    const openGameNote = () => {
        setShortNote(note, 1);
        openModal("game-note");
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

    const statusLabel = React.useMemo(() => {
        return gameNoteStatusLabels.find(
            (status) => status.value === note.status
        );
    }, [note.status]);

    const statusBadgeVariant = React.useMemo(():
        | "default"
        | "secondary"
        | "destructive"
        | "outline" => {
        if (note.status === "dropped" || note.status === "skipped") {
            return "destructive";
        } else if (note.status === "finished" || note.status === "playing") {
            return "default";
        } else if (note.status === "paused" || note.status === "planned") {
            return "secondary";
        }
        return "outline";
    }, [note.status]);

    const StatusIcon = ({ classname }: { classname?: string }) => {
        if (note.status === "dropped") {
            return <ImageOff className={classname} />;
        } else if (note.status === "finished") {
            return <CheckCheck className={classname} />;
        } else if (note.status === "playing") {
            return <Loader className={classname} />;
        } else if (note.status === "paused") {
            return <Pause className={classname} />;
        } else if (note.status === "planned") {
            return <FastForward className={classname} />;
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-4 shadow rounded-lg p-4 border text-start">
            <div className="flex justify-between gap-4 w-full">
                <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center min-w-[100px] min-h-[150px] border-2 rounded-md bg-gray-5 dark:bg-gray-800">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageOff />
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 w-full justify-between">
                        <div className="space-y-1">
                            <div>
                                <span className="font-bold text-md">
                                    {note.name}
                                </span>
                                &nbsp;&nbsp;
                                {note.releaseDate && (
                                    <span className="text-muted-foreground text-sm">
                                        {new Date(
                                            note.releaseDate
                                        ).getFullYear()}
                                    </span>
                                )}
                            </div>
                            <table>
                                <tbody>
                                    <tr>
                                        <td className="text-sm pt-2 w-32">
                                            Suggested on
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
                                        <td className="text-sm w-32">
                                            Suggested by
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
                        <Badge
                            variant={statusBadgeVariant}
                            className="w-min h-min flex items-center gap-1"
                        >
                            <StatusIcon classname="w-4 h-4" />
                            {statusLabel?.label ?? "Unknown"}
                        </Badge>
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
