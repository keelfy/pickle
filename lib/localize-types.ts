import { ContentCategory } from "@/utils/api/types";

export const localizeContentCategory = (category: ContentCategory, multiple: boolean = false) => {
    switch (category) {
        case "games":
            return multiple ? "Games" : "Game";
        case "video":
            return multiple ? "Videos" : "Video";
        case "movies":
            return multiple ? "Movies" : "Movie";
        case "series":
            return multiple ? "Series" : "Series";
        case "anime":
            return multiple ? "Anime" : "Anime";
        default:
            return multiple ? "Content" : "Content";
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
