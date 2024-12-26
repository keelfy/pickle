export type ApiType = {
    idx: number;
    label: string;
}

export const orderCategories: ApiType[] = [
    { idx: 0, label: "Custom" },
    { idx: 1, label: "Game" },
    { idx: 2, label: "Anime" },
    { idx: 3, label: "Movie" },
    { idx: 4, label: "Series" },
    { idx: 5, label: "Video" },
];

export const orderStatuses: ApiType[] = [
    { idx: 0, label: "Pending" },
    { idx: 1, label: "Approved" },
    { idx: 2, label: "Rejected" },
]

export const paymentTypes: ApiType[] = [
    { idx: 0, label: "None" },
    { idx: 1, label: "Pickle" },
    { idx: 2, label: "Twitch Points" },
    { idx: 3, label: "Donation Alerts" },
    { idx: 4, label: "DonatePay" },
    { idx: 5, label: "StreamElements" },
    { idx: 6, label: "StreamLabs" },
]

export const gameNoteStatuses: ApiType[] = [
    { idx: 0, label: "Playing" },
    { idx: 1, label: "Played" },
    { idx: 2, label: "Planned" },
    { idx: 3, label: "Abandoned" },
    { idx: 4, label: "On Hold" },
    { idx: 5, label: "Completed" },
    { idx: 6, label: "Skipped" },
    { idx: 7, label: "Banned" },
]

export const gameNoteCompletionStatuses: ApiType[] = [
    { idx: 0, label: "Finished" },
    { idx: 1, label: "Unfinished" },
    { idx: 2, label: "Endless" },
]
