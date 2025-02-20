import { Badge } from "@/components/ui/badge";
import { ContentNoteStatusIcon } from "@/components/ui/content-note/content-note-status-icon";
import { localizeContentNoteStatus } from "@/lib/localize-types";
import { cn } from "@/lib/utils";
import { ContentNoteStatus, GameNoteStatus, MovieNoteStatus } from "@/utils/api/types";

type Props = {
    status: ContentNoteStatus | undefined;
    className?: string;
};

const getStatusBadgeVariant = (status: GameNoteStatus | MovieNoteStatus | undefined) => {
    switch (status) {
        case "dropped":
        case "skipped":
            return "destructive";
        case "finished":
        case "watched":
        case "playing":
            return "default";
        case "paused":
        case "planned":
            return "secondary";
        default:
            return "outline";
    }
}

export default function ContentNoteStatusBadge({ status, className }: Props) {
    const statusLabel = localizeContentNoteStatus(status);
    const statusBadgeVariant = getStatusBadgeVariant(status);

    return (
        <Badge
            variant={statusBadgeVariant}
            className={cn("w-min h-min flex items-center gap-1", className)}
        >
            <ContentNoteStatusIcon status={status} classname="w-4 h-4" />
            <label>{statusLabel}</label>
        </Badge>
    );
}
