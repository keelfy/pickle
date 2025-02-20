"use client";

import ContentNoteSortFilterGrid, { ContentNoteGridSortOption } from "@/components/ui/content-note/content-note-sort-filter-grid";
import { MovieNoteSearchResult } from "@/utils/api/types";
import MovieNoteCard from "./movie-note-card";
import { ContentNoteGridSelectFilterOption } from "@/components/ui/content-note/content-note-grid-filters";

const getCursorValue = (item: MovieNoteSearchResult, column: string): string => {
    switch (column) {
        case 'created_at':
            return new Date(item.createdAt).toISOString();
        case 'watched_at':
            return item.watchedAt ? new Date(item.watchedAt).toISOString() : '';
        case 'name':
            return item.name;
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
        label: "Recently Watched",
        value: "watched_at.desc",
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


const statusFilterOptions: ContentNoteGridSelectFilterOption[] = [
    { value: "planned", label: "Planned" },
    { value: "skipped", label: "Skipped" },
    { value: "watched", label: "Watched" },
    { value: "dropped", label: "Dropped" },
]

export default function MovieNoteGrid() {
    return (
        <ContentNoteSortFilterGrid
            category="movies"
            sortOptions={SORT_OPTIONS}
            getCursorValue={getCursorValue}
            getContentNoteCard={(note, defaultReactions) => (
                <MovieNoteCard note={note} defaultReactions={defaultReactions} />
            )}
            filtering={{
                statusOptions: statusFilterOptions,
            }}
        />
    )
}
