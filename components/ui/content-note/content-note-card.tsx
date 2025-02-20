import ContentNoteClickablePoster from "@/components/ui/content-note/content-note-clickable-poster";
import { cn } from "@/lib/utils";
import { ContentCategory, ContentNote, ContentNoteSearchResult, Reaction } from "@/utils/api/types";
import React from "react";
import ContentNoteReactions from "./content-note-reactions";
import ContentNoteCardComment from "./content-note-card-comment";
import ContentNoteCardRating from "./content-note-card-rating";
import ContentNoteStatusBadge from "./content-note-status-badge";
import ContentNoteCardControls from "./content-note-card-controls";

type ContentNoteCardShellProps = React.ComponentProps<"div">;

function ContentNoteCardShell({ children, className, ...props }: React.PropsWithChildren<ContentNoteCardShellProps>) {
    return (
        <div className={cn("flex flex-col gap-4 shadow rounded-lg p-4 border text-start", className)} {...props}>
            {children}
        </div>
    )
}
ContentNoteCardShell.displayName = "ContentNoteCardShell";

export { ContentNoteCardShell, type ContentNoteCardShellProps };

type ContentNoteCardHeaderProps = React.ComponentProps<"div">;

function ContentNoteCardHeader({ children, className, ...props }: React.PropsWithChildren<ContentNoteCardHeaderProps>) {
    return (
        <div className={cn("flex justify-between gap-4", className)} {...props}>
            {children}
        </div>
    )
}
ContentNoteCardHeader.displayName = "ContentNoteCardHeader";

export { ContentNoteCardHeader, type ContentNoteCardHeaderProps };

type ContentNoteCardHeaderInfoProps = React.ComponentProps<"div"> & {
    note: ContentNote;
    category: ContentCategory;
};

function ContentNoteCardHeaderInfo({ note, category, children, className, ...props }: React.PropsWithChildren<ContentNoteCardHeaderInfoProps>) {
    return (
        <div className={cn("flex gap-4", className)} {...props}>
            <ContentNoteClickablePoster
                content={note}
                category={category}
            />
            {children}
        </div>
    )
}
ContentNoteCardHeaderInfo.displayName = "ContentNoteCardHeaderInfo";

export { ContentNoteCardHeaderInfo, type ContentNoteCardHeaderInfoProps };

type ContentNoteCardHeaderSummaryProps = React.ComponentProps<"div">;

function ContentNoteCardHeaderSummary({ children, className, ...props }: React.PropsWithChildren<ContentNoteCardHeaderSummaryProps>) {
    return (
        <div className={cn("flex-1 flex flex-col gap-1 w-full justify-between", className)} {...props}>
            {children}
        </div>
    )
}
ContentNoteCardHeaderSummary.displayName = "ContentNoteCardHeaderSummary";

export { ContentNoteCardHeaderSummary, type ContentNoteCardHeaderSummaryProps };

type ContentNoteCardHeaderNameProps = React.ComponentProps<"div"> & {
    title: string;
    startYear?: number;
    endYear?: number;
};

function ContentNoteCardHeaderName({ title, startYear, endYear, className, ...props }: React.PropsWithChildren<ContentNoteCardHeaderNameProps>) {
    return (
        <div className="flex items-center gap-2">
            <span className="font-bold text-md">
                {title}
            </span>
            {startYear && (
                <span className="text-muted-foreground text-sm">
                    {startYear}
                </span>
            )}
            {startYear && endYear && (
                <span className="text-muted-foreground text-sm">
                    -
                </span>
            )}
            {endYear && (
                <span className="text-muted-foreground text-sm">
                    {endYear}
                </span>
            )}
        </div>
    )
}
ContentNoteCardHeaderName.displayName = "ContentNoteCardHeaderName";

export { ContentNoteCardHeaderName, type ContentNoteCardHeaderNameProps };

type ContentNoteCardHeaderDataTableColumn<T extends ContentNote> = {
    icon: React.ReactNode;
    label: string | React.ReactNode | ((note: T) => React.ReactNode);
    value: (note: T) => React.ReactNode;
}

type ContentNoteCardHeaderDataTableColumnGroup<T extends ContentNote> = {
    columns: ContentNoteCardHeaderDataTableColumn<T>[];
}


type ContentNoteCardHeaderDataTableProps<T extends ContentNote> = {
    columnGroups: ContentNoteCardHeaderDataTableColumnGroup<T>[];
    note: T;
    className?: string;
}

function ContentNoteCardHeaderDataTable<T extends ContentNote>({ columnGroups, note, ...props }: ContentNoteCardHeaderDataTableProps<T>) {
    return (
        <table {...props}>
            <tbody>
                {columnGroups.map((group) => group.columns.map((col, index) => {
                    const label = typeof col.label === "function" ? col.label(note) : col.label;
                    const value = typeof col.value === "function" ? col.value(note) : col.value;

                    return (
                        <tr key={typeof label === "string" ? label : index}>
                            <td className={cn("text-sm w-32 flex items-center gap-1", index === 0 && "pt-2")}>
                                {col.icon}
                                {label}
                            </td>
                            <td className={cn("text-sm", index === 0 && "pt-2")}>
                                {value}
                            </td>
                        </tr>
                    )
                }))}
            </tbody>
        </table>
    )
}
ContentNoteCardHeaderDataTable.displayName = "ContentNoteCardHeaderDataTable";

export {
    ContentNoteCardHeaderDataTable,
    type ContentNoteCardHeaderDataTableProps,
    type ContentNoteCardHeaderDataTableColumnGroup,
    type ContentNoteCardHeaderDataTableColumn
};

type ContentNoteCardProps<T extends ContentNoteSearchResult> = {
    note: T;
    category: ContentCategory;
    defaultReactions?: Reaction[];
    releaseYear?: number;
    finishedYear?: number;
    columnGroups: ContentNoteCardHeaderDataTableColumnGroup<T>[];
}

export default function ContentNoteCard<T extends ContentNoteSearchResult>({ note, category, defaultReactions, releaseYear, finishedYear, columnGroups }: ContentNoteCardProps<T>) {
    return (
        <ContentNoteCardShell>
            <ContentNoteCardHeader>
                <ContentNoteCardHeaderInfo note={note} category={category}>
                    <ContentNoteCardHeaderSummary>
                        <div className="space-y-1">
                            <ContentNoteCardHeaderName
                                title={note.name}
                                startYear={releaseYear}
                                endYear={finishedYear}
                            />
                            <ContentNoteCardHeaderDataTable
                                note={note}
                                columnGroups={columnGroups}
                            />
                        </div>
                        <ContentNoteCardControls contentNote={note} category={category} />
                    </ContentNoteCardHeaderSummary>
                </ContentNoteCardHeaderInfo>
                <div className="h-min flex gap-4">
                    <div className="px-2 py-4">
                        <ContentNoteStatusBadge status={note.status} />
                    </div>
                    <ContentNoteCardRating rate={note.rate} />
                </div>
            </ContentNoteCardHeader>
            <ContentNoteCardComment comment={note.comment} />
            {defaultReactions && (
                <ContentNoteReactions
                    contentNote={note}
                    category={category}
                    defaultReactions={defaultReactions}
                />
            )}
        </ContentNoteCardShell>
    );
}

