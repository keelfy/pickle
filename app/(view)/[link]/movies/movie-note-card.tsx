import ContentNoteCard, { ContentNoteCardHeaderDataTableColumnGroup } from "@/components/ui/content-note/content-note-card";
import { MovieNoteSearchResult, Reaction } from "@/utils/api/types";
import {
    History,
    UserPlus2
} from "lucide-react";

type Props = {
    note: MovieNoteSearchResult;
    defaultReactions?: Reaction[];
}

export default function MovieNoteCard({ note, defaultReactions }: Props) {

    const columnGroups: ContentNoteCardHeaderDataTableColumnGroup<MovieNoteSearchResult>[] = [{
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
                label: "Requester",
                value: (note) => (
                    <p>
                        {note.initialOrdererUsername ?? (
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
            category="movies"
            columnGroups={columnGroups}
            releaseYear={note.releaseDate ? new Date(note.releaseDate).getFullYear() : undefined}
            defaultReactions={defaultReactions}
        />
    );
}
