"use client";

import {
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandList
} from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { useProfileStore } from "@/providers/profile-store";
import { fetchApi } from "@/utils/api/client";
import React from "react";
import ContentSearchItem from "./content-search-item";

export default function ProfileSearchDialogContent() {
    const { profile } = useProfileStore((state) => state);
    const [query, setQuery] = React.useState<string>("");
    const [debouncedQuery, setDebouncedQuery] = React.useState<string>("");
    const [result, setResult] = React.useState<ContentSearchHits>();
    const [isLoading, startTransition] = React.useTransition();

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query);
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
                const response = await fetchApi<ContentSearchHits>(
                    `/v1/content?query=${debouncedQuery}&profileId=${profile?.id}`
                );
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

    return (
        <>
            <CommandInput
                placeholder="Search for content in this profile"
                onValueChange={setQuery}
                value={query}
            />
            <CommandList>
                <CommandEmpty>No results found</CommandEmpty>
                {result?.content && result.content.length > 0 && (
                    <CommandGroup heading={GroupHeading}>
                        {result?.content.map((hit) => (
                            <ContentSearchItem
                                key={hit.source.id}
                                source={hit.source}
                                link={profile!.link}
                            />
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </>
    );
}
