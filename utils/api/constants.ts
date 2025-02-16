import { ContentCategory, GameNoteStatus, OrderStatus } from "./types";

export type ApiType<T extends string> = {
    value: T;
    label: string;
}

export const contentCategoryLabels: ApiType<ContentCategory>[] = [
    { value: "games", label: "Game" },
    { value: "anime", label: "Anime" },
    { value: "movies", label: "Movie" },
    { value: "series", label: "Series" },
    { value: "video", label: "Video" },
];

export const orderStatusLabels: ApiType<OrderStatus>[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
]

export const gameNoteStatusLabels: ApiType<GameNoteStatus>[] = [
    { value: "playing", label: "Playing" },
    { value: "paused", label: "Paused" },
    { value: "dropped", label: "Dropped" },
    { value: "finished", label: "Finished" },
    { value: "skipped", label: "Skipped" },
    { value: "planned", label: "Planned" },
]
