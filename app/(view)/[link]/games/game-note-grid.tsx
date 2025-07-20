"use client";

import ContentNoteSortFilterGrid, { ContentNoteGridSortOption } from "@/components/ui/content-note/content-note-sort-filter-grid";
import { GameNoteSearchResult } from "@/utils/api/types";
import GameNoteCard from "./game-note-card";
import { ContentNoteGridSelectFilterOption } from "@/components/ui/content-note/content-note-grid-filters";

const getCursorValue = (item: GameNoteSearchResult, column: string): string => {
    switch (column) {
        case 'created_at':
            return new Date(item.createdAt).toISOString();
        case 'last_played_at':
            return item.lastPlayedAt ? new Date(item.lastPlayedAt).toISOString() : '';
        case 'title':
            return item.title;
        case 'rate':
            return item.rate?.toString() || '';
        default:
            return '';
    }
};

const SORT_OPTIONS: ContentNoteGridSortOption[] = [
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
];


const gameNoteStatusFilterOptions: ContentNoteGridSelectFilterOption[] = [
    { value: "planned", label: "Planned" },
    { value: "playing", label: "Playing" },
    { value: "paused", label: "Paused" },
    { value: "skipped", label: "Skipped" },
    { value: "finished", label: "Finished" },
    { value: "dropped", label: "Dropped" },
]

export default function GameNoteGrid() {
    return (
        <ContentNoteSortFilterGrid
            category="games"
            sortOptions={SORT_OPTIONS}
            getCursorValue={getCursorValue}
            getContentNoteCard={(note, defaultReactions) => (
                <GameNoteCard note={note} defaultReactions={defaultReactions} />
            )}
            filtering={{
                statusOptions: gameNoteStatusFilterOptions,
            }}
        />
    )
}
