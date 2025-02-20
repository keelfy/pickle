"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { fetchContentSearch } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { ModalType } from "@/stores/modal";
import { contentCategoryLabels } from "@/utils/api/constants";
import { ContentSearchHits } from "@/utils/api/response";
import { Content } from "@/utils/api/types";
import React from "react";

export default function ProfileSearchDialogContent() {
    const { modalParams, setModalParams, openModal, closeModal } =
        useModalStore((state) => state);
    const { profile } = useProfileStore((state) => state);
    const [query, setQuery] = React.useState<string>(modalParams?.query ?? "");
    const [debouncedQuery, setDebouncedQuery] = React.useState<string>("");
    const [result, setResult] = React.useState<ContentSearchHits>();
    const [isLoading, startTransition] = React.useTransition();

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query);
            setModalParams({
                query,
            });
        }, 300);

        return () => {
            clearTimeout(timeout);
        };
    }, [query]);

    React.useEffect(() => {
        if (
            !debouncedQuery ||
            debouncedQuery.length < 2 ||
            debouncedQuery.length > 100
        ) {
            setResult(undefined);
            return;
        }

        startTransition(async () => {
            try {
                const response = await fetchContentSearch(profile, debouncedQuery, 0, 10);
                setResult(response);
            } catch (error: any) {
                toast({
                    title: "Failed to fetch search results",
                    description: error.message ?? "An error occurred",
                });
            }
        });
    }, [debouncedQuery]);

    const GroupHeading: React.ReactNode = React.useMemo(
        () => (
            <>
                Best matches for profile&nbsp;
                <span className="font-bold">{profile?.username}</span>
            </>
        ),
        [profile?.username]
    );
    const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

    React.useEffect(() => {
        setSelectedIndex(0);
    }, [result?.content]);

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
            if (!result?.content?.length) return;

            if (event.key === "ArrowDown") {
                setSelectedIndex((prev) =>
                    Math.min(prev + 1, result.content.length - 1)
                );
            } else if (event.key === "ArrowUp") {
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (event.key === "Enter") {
                const selectedContent = result.content[selectedIndex];
                if (selectedContent) {
                    handleEntryClick(selectedContent.source);
                }
            }
        },
        [result?.content, selectedIndex, openModal]
    );

    const handleEntryClick = ({ category, id }: Content) => {
        switch (category) {
            case "games":
                openModal(ModalType.GameNote, { id });
                break;
            case "movies":
                openModal(ModalType.MovieNote, { id });
                break;
        }
    }

    return (
        <>
            <CommandInput
                placeholder="Search for content in this profile"
                onValueChange={setQuery}
                value={query}
                onKeyDown={handleKeyDown}
            />
            <CommandList>
                <CommandEmpty>No results found</CommandEmpty>
                {result?.content && result.content.length > 0 && (
                    <CommandGroup heading={GroupHeading} className="pb-2">
                        {result?.content.map(({ source }) => (
                            <CommandItem
                                key={source.id}
                                asChild
                                className="p-2 cursor-pointer"
                            >
                                <Button
                                    className="flex items-center justify-between w-full"
                                    variant="ghost"
                                    onClick={() => handleEntryClick(source)}
                                >
                                    <div className="text-md">{source.name}</div>
                                    <Badge>
                                        {
                                            contentCategoryLabels.find(
                                                (cat) =>
                                                    cat.value ===
                                                    source.category
                                            )?.label
                                        }
                                    </Badge>
                                </Button>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </>
    );
}
