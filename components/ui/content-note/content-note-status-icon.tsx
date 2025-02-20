import { GameNoteStatus, MovieNoteStatus } from "@/utils/api/types";
import { CheckCheckIcon, FastForwardIcon, ImageOffIcon, LoaderIcon, PauseIcon, SkipBackIcon } from "lucide-react";

type Props = {
    status: GameNoteStatus | MovieNoteStatus | undefined;
    classname?: string;
}

export const ContentNoteStatusIcon = ({ status, classname }: Props) => {
    if (status === "dropped") {
        return <ImageOffIcon className={classname} />;
    } else if (status === "finished" || status === "watched") {
        return <CheckCheckIcon className={classname} />;
    } else if (status === "playing") {
        return <LoaderIcon className={classname} />;
    } else if (status === "paused") {
        return <PauseIcon className={classname} />;
    } else if (status === "planned") {
        return <FastForwardIcon className={classname} />;
    } else if (status === "skipped") {
        return <SkipBackIcon className={classname} />;
    }
    return null;
};
