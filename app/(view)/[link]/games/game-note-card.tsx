import ContentNoteCard, { ContentNoteCardHeaderDataTableColumnGroup } from "@/components/ui/content-note/content-note-card";
import { useProfileStore } from "@/providers/profile-store";
import { GameNoteSearchResult, Reaction } from "@/utils/api/types";
import {
    History,
    UserPlus2
} from "lucide-react";

type Props = {
    note: GameNoteSearchResult;
    defaultReactions?: Reaction[];
}

export default function GameNoteCard({ note, defaultReactions }: Props) {
    const profile = useProfileStore((state) => state.profile);


    const columnGroups: ContentNoteCardHeaderDataTableColumnGroup<GameNoteSearchResult>[] = [{
        columns: [
            {
                icon: <History size={12} />,
                label: "Since",
                value: (note) => new Date(note.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                })
            },
            {
                icon: <UserPlus2 size={12} />,
                label: note.initialOrdererUserId !== profile?.id ? "Requester" : "Added by",
                value: (note) => (
                    <p>
                        {note.initialOrdererDisplayName ?? (
                            <span className="text-muted-foreground">
                                "N/A"
                            </span>
                        )}
                        <span className="text-muted-foreground text-xs">
                            {note.ordererCount > 1 && ` + ${note.ordererCount - 1} more`}
                        </span>
                    </p>
                )
            }
        ]
    }];

    return (
        <ContentNoteCard
            note={note}
            category="games"
            columnGroups={columnGroups}
            releaseYear={note.releaseDate ? new Date(note.releaseDate).getFullYear() : undefined}
            defaultReactions={defaultReactions}
        />
    );
}
