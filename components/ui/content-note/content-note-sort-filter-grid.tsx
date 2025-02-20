"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchBatchContentNoteReactions, fetchProfileContentNotes } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { localizeContentCategory } from "@/lib/localize-types";
import { useProfileStore } from "@/providers/profile-store";
import useFilterQueryState, { Filter } from "@/query-params/filter";
import useSortQueryState from "@/query-params/sort";
import { ContentCategory, ContentNoteSearchResult, NoteReaction, Reaction } from "@/utils/api/types";
import { SelectTrigger } from "@radix-ui/react-select";
import { FilterIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import React from "react";
import { useInView } from "react-intersection-observer";
import ContentNoteGridFilters, { ContentNoteGridSelectFilterOption } from "./content-note-grid-filters";

export type ContentNoteGridSortOption = {
    label: string;
    value: string; // "column_name.direction", e.g. "created_at.desc"
}

type Props<T extends ContentNoteSearchResult> = {
    category: ContentCategory;
    sortOptions: ContentNoteGridSortOption[];
    getCursorValue: (item: T, column: string) => string;
    getContentNoteCard: (note: T, defaultReactions?: Reaction[]) => React.ReactNode;
    filtering: {
        statusOptions: ContentNoteGridSelectFilterOption[];
    }
}

export default function ContentNoteSortFilterGrid<T extends ContentNoteSearchResult>({ category, sortOptions, getCursorValue, getContentNoteCard, filtering }: Props<T>) {
    const profile = useProfileStore((state) => state.profile);
    const [notes, setNotes] = React.useState<T[]>([]);
    const [reactions, setReactions] = React.useState<NoteReaction[]>();

    const [isLoading, setIsLoading] = React.useState(false);
    const { sort, setSort, isInitialized: isSortInitialized } = useSortQueryState("created_at.desc")
    const { filters, setFilters, isInitialized: isFilterInitialized } = useFilterQueryState();
    const [hasMore, setHasMore] = React.useState(true);
    const [cursor, setCursor] = React.useState<string>("");

    const { ref, inView } = useInView();

    async function fetchContentNotes(sort: string, cursor: string, filters: Filter[], resetList = false) {
        if (isLoading || !profile?.id) return;

        const sortColumn = sort.split(".")[0] ?? "created_at";
        const sortDirection = sort.split(".")[1] ?? "desc";

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: '20',
                column: sortColumn,
                direction: sortDirection,
                posterSize: 'sm',
            });

            // Only add cursor if it exists and we're not resetting the list
            if (cursor.length > 0 && !resetList) {
                params.append('cursor', cursor);
            }

            if (filters.length > 0) {
                params.append('filters', filters.map(filter => `${filter.name}:${filter.value}`).join(','));
            }

            const notes = await fetchProfileContentNotes<T>(profile, category, params);
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
                title: `Failed to fetch ${localizeContentCategory(category, false).toLowerCase()} notes`,
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
        if (inView && hasMore) {
            fetchContentNotes(sort, cursor, filters);
        }
    }, [inView]);

    React.useEffect(() => {
        if (!profile?.id || !isSortInitialized || !isFilterInitialized) return;

        setCursor("");
        setHasMore(true);
        fetchContentNotes(sort, "", filters, true);
    }, [profile?.id, sort, filters, isSortInitialized, isFilterInitialized]);

    React.useEffect(() => {
        if (!notes || notes.length === 0 || !profile?.id) return;
        const fetchReactions = async () => {
            try {
                const reactions = await fetchBatchContentNoteReactions(profile, category, notes.map((note) => note.id));
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
        <>
            <div className="flex items-center gap-4 justify-between w-full">
                <Label className="text-xl">{localizeContentCategory(category, true)}</Label>
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
                                {sortOptions.find((option) => option.value === sort)?.label}
                            </Button>
                        </SelectTrigger>
                        <SelectContent align='end'>
                            {sortOptions.map((option) => (
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
                            <ContentNoteGridFilters
                                value={filters}
                                onChange={handleFiltersChange}
                                statusOptions={filtering.statusOptions}
                            />
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
                        <div key={note.id}>
                            {getContentNoteCard(note, defaultReactions)}
                        </div>
                    );
                })}
                {notes.length === 0 && (
                    <div className="flex items-center justify-center w-full h-full">
                        <p className="text-muted-foreground text-sm">No {localizeContentCategory(category, true).toLowerCase()} found.</p>
                    </div>
                )}
            </div>
            <div ref={ref} className="h-10 flex items-center justify-center w-full">
                {isLoading && <LoadingSpinner type="bars" />}
            </div>
        </>
    );
}
