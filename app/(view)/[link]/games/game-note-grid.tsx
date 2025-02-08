"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchBatchGameNoteReactions, fetchProfileGameNotes } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/providers/profile-store";
import { Filter, Search, SortAsc } from "lucide-react";
import React from "react";
import GameNoteCard from "./game-note-card";

type Props = {
    className?: string;
}

export default function GameNoteGrid({ className }: Props) {
    const profile = useProfileStore((state) => state.profile);
    const [notes, setNotes] = React.useState<GameNote[]>([]);
    const [reactions, setReactions] = React.useState<NoteReaction[]>();

    React.useEffect(() => {
        if (!profile) return;

        const fetchNotes = async () => {
            try {
                const notes = await fetchProfileGameNotes(profile, new Date("1900-01-20").toISOString(), 10, 'desc');
                setNotes(notes ?? []);
            } catch (error: any) {
                toast({
                    title: "Failed to fetch game notes",
                    description: error.message ?? "An error occurred",
                });
            }
        };
        fetchNotes();
    }, [profile?.id]);

    React.useEffect(() => {
        if (!notes || notes.length === 0) return;
        const fetchReactions = async () => {
            try {
                const reactions = await fetchBatchGameNoteReactions(profile, notes.map((note) => note.id));
                if (reactions) {
                    setReactions(reactions);
                }
            } catch (error: any) {
                console.error(error);
            }
        }
        fetchReactions();
    }, [notes]);

    return (
        <div className={cn("flex flex-col gap-8 justify-center md:justify-start md:items-start", className)}>
            <div className="flex items-center gap-4 justify-between w-full">
                <Label className="text-xl">Games</Label>
                <div className="flex items-center gap-2">
                    <div className="relative min-w-96">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="What are you looking for?"
                            className="pl-8"
                        />
                    </div>
                    <Button variant="ghost" size="icon">
                        <SortAsc />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Filter />
                    </Button>
                </div>
            </div>
            {/* <div className="grid grid-flow-row w-full gap-4 justify-between md:grid-cols-[repeat(auto-fit,230px)]"> */}
            <div className="flex flex-col gap-8 w-full">
                {notes.map((note) => {
                    const defaultReactions = reactions
                        ?.filter((reaction) => reaction.noteId === note.id)
                        .flatMap((reaction) => reaction.reactions);

                    return (
                        <GameNoteCard
                            key={note.id}
                            note={note}
                            defaultReactions={defaultReactions}
                        />
                    );
                })}
            </div>
        </div>
    );
}
