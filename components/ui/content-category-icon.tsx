import { ContentCategory } from "@/utils/api/types";
import { SiYoutube } from "@icons-pack/react-simple-icons";
import { ClapperboardIcon, GamepadIcon, ListVideo, MonitorPlayIcon, SquirrelIcon, TvIcon } from "lucide-react";

type Props = {
    category: ContentCategory;
    className?: string;
}

export default function ContentCategoryIcon({ category, className }: Props) {
    if (category === "games") {
        return <GamepadIcon className={className} />;
    } else if (category === "video") {
        return <SiYoutube className={className} />;
    } else if (category === "movies") {
        return <ClapperboardIcon className={className} />;
    } else if (category === "anime") {
        return <SquirrelIcon className={className} />;
    } else if (category === "series") {
        return <TvIcon className={className} />;
    }
    return <ListVideo className={className} />;
}
