"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useModalStore } from "@/providers/modal";
import { useNoteStore } from "@/providers/note-store";
import { ModalType } from "@/stores/modal";
import { gameNoteStatusLabels } from "@/utils/api/constants";
import { ImageOff } from "lucide-react";

export default function LegacyGameNoteCard({ note }: { note: GameNote }) {
    const { openModal } = useModalStore((state) => state);
    const { setShortNote } = useNoteStore((state) => state);

    const matchingStatuses = gameNoteStatusLabels.filter(
        (s) => s.value === note.status
    );

    const openGameNote = () => {
        setShortNote(note, 1);
        openModal(ModalType.GameNote);
    };

    return (
        <Card
            onClick={openGameNote}
            className="space-y-4 w-[230px] p-6 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer h-min"
        >
            <div className="flex flex-col items-center justify-center min-w-[173px] min-h-[208px] border-2 rounded-lg bg-gray-5 dark:bg-gray-800">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageOff />
                </div>
            </div>
            <div className="text-md font-bold">{note.name}</div>
            <table className="text-xs w-full">
                <tbody>
                    <tr>
                        <td>Status</td>
                        <td className="text-center py-1">
                            <Badge variant="outline">
                                {matchingStatuses.length > 0
                                    ? matchingStatuses[0].label
                                    : "Unknown"}
                            </Badge>
                        </td>
                    </tr>
                    <tr>
                        <td>Request date</td>
                        <td className="text-center py-1">
                            {new Date(note.createdAt).toLocaleDateString()}
                        </td>
                    </tr>
                </tbody>
            </table>
        </Card>
    );
}
