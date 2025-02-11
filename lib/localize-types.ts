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
