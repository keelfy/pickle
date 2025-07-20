import { ContentCategory, ContentNoteStatus } from "@/utils/api/types";

export const localizeContentCategory = (category: ContentCategory, plural: boolean = false) => {
    switch (category) {
        case "games":
            return plural ? "Games" : "Game";
        case "video":
            return plural ? "Videos" : "Video";
        case "movies":
            return plural ? "Movies" : "Movie";
        case "series":
            return plural ? "Series" : "Series";
        case "anime":
            return plural ? "Anime" : "Anime";
        default:
            return plural ? "Content" : "Content";
    }
}

export const localizeContentNoteStatus = (status: ContentNoteStatus | undefined) => {
    switch (status) {
        case "playing":
            return "Playing";
        case "paused":
            return "Paused";
        case "dropped":
            return "Dropped";
        case "finished":
            return "Finished";
        case "watched":
            return "Watched";
        case "skipped":
            return "Skipped";
        case "planned":
            return "Planned";
        default:
            return "Unknown";
    }
}

export const localizeOrderSource = (source: string) => {
    switch (source) {
        case "twitch-channel-points":
            return "Twitch";
    }
}

export const getTimeAgoText = (date: Date) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) {
        return `${years} year${years > 1 ? "s" : ""}`;
    }

    if (months > 0) {
        return `${months} month${months > 1 ? "s" : ""}`;
    }

    if (days > 0) {
        return `${days} day${days > 1 ? "s" : ""}`;
    }

    if (hours > 0) {
        return `${hours} hour${hours > 1 ? "s" : ""}`;
    }

    if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }

    return `${seconds} second${seconds > 1 ? "s" : ""}`;
};
