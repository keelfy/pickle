import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { gameNoteStatusLabels } from "@/utils/api/constants";
import { CheckCheck, FastForward, ImageOff, Loader, Pause } from "lucide-react";
import React from "react";

type Props = {
    status: GameNoteStatus | undefined;
    className?: string;
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

    const StatusIcon = ({ classname }: { classname?: string }) => {
        if (status === "dropped") {
            return <ImageOff className={classname} />;
        } else if (status === "finished") {
            return <CheckCheck className={classname} />;
        } else if (status === "playing") {
            return <Loader className={classname} />;
        } else if (status === "paused") {
            return <Pause className={classname} />;
        } else if (status === "planned") {
            return <FastForward className={classname} />;
        }
        return null;
    };

    return (
        <Badge
            variant={statusBadgeVariant}
            className={cn("w-min h-min flex items-center gap-1", className)}
        >
            <StatusIcon classname="w-4 h-4" />
            {statusLabel?.label ?? "Unknown"}
        </Badge>
    );
}
