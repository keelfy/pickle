import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { gameNoteStatusLabels } from "@/utils/api/constants";
import { ArrowDownAZIcon, CheckCheckIcon, FastForwardIcon, ImageOffIcon, LoaderIcon, PauseIcon, SkipBackIcon } from "lucide-react";
import React from "react";

type Props = {
    status: GameNoteStatus | undefined;
    className?: string;
};

export const GameNoteStatusIcon = ({ status, classname }: { status: GameNoteStatus | undefined, classname?: string }) => {
    if (status === "dropped") {
        return <ImageOffIcon className={classname} />;
    } else if (status === "finished") {
        return <CheckCheckIcon className={classname} />;
    } else if (status === "playing") {
        return <LoaderIcon className={classname} />;
    } else if (status === "paused") {
        return <PauseIcon className={classname} />;
    } else if (status === "planned") {
        return <FastForwardIcon className={classname} />;
    } else if (status === "skipped") {
        return <SkipBackIcon className={classname} />;
    } else if (status === "any") {
        return <ArrowDownAZIcon className={classname} />;
    }
    return null;
};

export default function GameNoteStatusBadge({ status, className }: Props) {
    const statusLabel = React.useMemo(() => {
        return gameNoteStatusLabels.find((s) => s.value === status);
    }, [status]);

    const statusBadgeVariant = React.useMemo(():
        | "default"
        | "secondary"
        | "destructive"
        | "outline" => {
        if (status === "dropped" || status === "skipped") {
            return "destructive";
        } else if (status === "finished" || status === "playing") {
            return "default";
        } else if (status === "paused" || status === "planned") {
            return "secondary";
        }
        return "outline";
    }, [status]);

    return (
        <Badge
            variant={statusBadgeVariant}
            className={cn("w-min h-min flex items-center gap-1", className)}
        >
            <GameNoteStatusIcon status={status} classname="w-4 h-4" />
            <label>{statusLabel?.label ?? "Unknown"}</label>
        </Badge>
    );
}
