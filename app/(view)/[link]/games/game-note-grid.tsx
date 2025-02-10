"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchBatchGameNoteReactions, fetchProfileGameNotes } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/providers/profile-store";
import useFilterQueryState, { Filter } from "@/query-params/filter";
import useSortQueryState from "@/query-params/sort";
import { SelectTrigger } from "@radix-ui/react-select";
import { FilterIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import React, { useState } from "react";
import { useInView } from "react-intersection-observer";
import GameNoteCard from "./game-note-card";
import GameNoteFiltersContent from "./game-note-filters-content";
import { GameNote, NoteReaction } from "@/utils/api/types";
export type Props = {
    className?: string;
}

// Helper function to get the correct cursor value based on column type
const getCursorValue = (item: GameNote, column: string): string => {
    switch (column) {
        case 'created_at':
            return new Date(item.createdAt).toISOString();
        case 'last_played_at':
            return item.lastPlayedAt ? new Date(item.lastPlayedAt).toISOString() : '';
        case 'name':
            return item.name;
        case 'rate':
            return item.rate?.toString() || '';
        default:
            return '';
    }
};

const SORT_OPTIONS = [
    {
        label: "Newest",
        value: "created_at.desc",
    },
    {
        label: "Oldest",
        value: "created_at.asc",
    },
    {
        label: "Recently Played",
        value: "last_played_at.desc",
    },
    {
        label: "Best Rated",
        value: "rate.desc",
    },
    {
        label: "Worst Rated",
        value: "rate.asc",
    },
    {
        label: "Name A-Z",
        value: "name.asc",
    },
    {
        label: "Name Z-A",
        value: "name.desc",
    },
];

export default function GameNoteGrid({ className }: Props) {
    const profile = useProfileStore((state) => state.profile);
    const [notes, setNotes] = React.useState<GameNote[]>([]);
    const [reactions, setReactions] = React.useState<NoteReaction[]>();

    const [isLoading, setIsLoading] = useState(false);
    const { sort, setSort, isInitialized: isSortInitialized } = useSortQueryState("created_at.desc")
    const { filters, setFilters, isInitialized: isFilterInitialized } = useFilterQueryState();
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string>();

    const { ref, inView } = useInView();

    async function fetchGameNotes(sort: string, cursor: string | undefined, hasMore: boolean, filters: Filter[] | undefined, resetList = false) {
        if (isLoading || (!hasMore && !resetList) || !profile?.id) return;

        const sortColumn = sort.split(".")[0] ?? "created_at";
        const sortDirection = sort.split(".")[1] ?? "desc";

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: '20',
                column: sortColumn,
                direction: sortDirection,
            });

            // Only add cursor if it exists and we're not resetting the list
            if (cursor && !resetList) {
                params.append('cursor', cursor);
            }

            if (filters && filters.length > 0) {
                params.append('filters', filters.map(filter => `${filter.name}:${filter.value}`).join(','));
            }

            const notes = await fetchProfileGameNotes(profile, params);
            if (notes?.length === 0) {
                setHasMore(false);

                if (resetList) {
                    setNotes([]);
                }
                return;
            }

            const lastItem = notes[notes.length - 1];
            const newCursor = getCursorValue(lastItem, sortColumn);

            setCursor(newCursor);
            setNotes(prev => (resetList ? notes : [...prev, ...notes]));
        } catch (error: any) {
            toast({
                title: "Failed to fetch game notes",
                description: error.message ?? "An error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
    };

    const handleFiltersChange = (newFilters: Filter[]) => {
        setFilters(newFilters);
    }

    React.useEffect(() => {
        if (inView) {
            fetchGameNotes(sort, cursor, hasMore, filters);
        }
    }, [inView]);

    React.useEffect(() => {
        if (!profile?.id || !isSortInitialized || !isFilterInitialized) return;

        setCursor(undefined);
        setHasMore(true);
        fetchGameNotes(sort, undefined, true, filters, true);
    }, [profile?.id, sort, filters, isSortInitialized, isFilterInitialized]);

    React.useEffect(() => {
        if (!notes || notes.length === 0 || !profile?.id) return;
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
                    {/* <div className="relative min-w-96">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="What are you looking for?"
                            className="pl-8"
                        />
                    </div> */}
                    <Select onValueChange={handleSortChange} defaultValue={sort} value={sort} disabled={isLoading}>
                        <SelectTrigger asChild>
                            <Button variant="ghost" disabled={isLoading}>
                                {sort.includes("asc") ? <SortAscIcon /> : <SortDescIcon />}
                                {SORT_OPTIONS.find((option) => option.value === sort)?.label}
                            </Button>
                        </SelectTrigger>
                        <SelectContent align='end'>
                            {SORT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost">
                                <FilterIcon />
                                Filter
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align='end'>
                            <GameNoteFiltersContent value={filters} onChange={handleFiltersChange} />
                        </PopoverContent>
                    </Popover>
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
            <div ref={ref} className="h-10 flex items-center justify-center">
                {isLoading && <LoadingSpinner />}
            </div>
        </div>
    );
}
