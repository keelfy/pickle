"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createContentNoteReaction, deleteContentNoteReaction } from "@/hooks/api-endpoints-client";
import useRedirectToLogin from "@/hooks/use-redirect-to-login";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { useProfileStore } from "@/providers/profile-store";
import { ContentCategory, ContentNote, ContentNoteSearchResult, Reaction } from "@/utils/api/types";
import { EmojiPicker } from "@ferrucc-io/emoji-picker";
import React from "react";

type Props = {
    contentNote: ContentNote;
    category: ContentCategory;
    defaultReactions: Reaction[];
    className?: string;
}

const randomReactions = ['🔥', '🤮', '❤️', '👍', '👎', '🤔', '💩', '🤡', '👏', '😁', '☠️', '🙁', '👐', '❤️‍🔥', '💔', '💀', '💥', '💦', '💨', '💤', '💫', '💬', '💭', '💡', '💢', '💣', '💤', '💫', '💬', '💭', '💡', '💢', '💣', '💤', '💫', '💬', '💭', '💡', '💢', '💣'];

export default function ContentNoteReactions({ contentNote, category, defaultReactions, className }: Props) {
    const user = useAuthStore((state) => state.user);
    const profile = useProfileStore((state) => state.profile);

    const redirectToLogin = useRedirectToLogin();

    const [reactions, setReactions] = React.useState<Reaction[]>(defaultReactions);
    const [isReactionsChanging, startReactionsChange] = React.useTransition();

    const canReact = () => {
        if (reactions.filter((reaction) => reaction.userReacted).length >= 3) {
            return false;
        }

        return true;
    }

    const handleEmojiClick = (emoteId: string) => {
        if (!user || !profile) {
            redirectToLogin();
            return;
        }

        if (isReactionsChanging) return;
        const reacted = reactions.find((reaction) => reaction.emoteId === emoteId);
        if (!reacted) return;

        if (reacted.userReacted) {
            startReactionsChange(async () => {
                const previousReactions = reactions;
                try {
                    if (reacted.count > 1) {
                        reacted.count--;
                        reacted.userReacted = false;
                    } else {
                        setReactions(currValue => currValue.filter((reaction) => reaction.emoteId !== emoteId));
                    }
                    await deleteContentNoteReaction(profile, category, contentNote.id, emoteId);
                    setReactions(currValue => currValue.sort((a, b) => b.count - a.count));
                } catch (error: any) {
                    console.error(error);
                    setReactions(previousReactions);
                }
            });
        } else if (canReact()) {
            startReactionsChange(async () => {
                const previousReactions = reactions;
                try {
                    reacted.userReacted = true;
                    reacted.count++;
                    await createContentNoteReaction(profile, category, contentNote.id, emoteId);
                    setReactions(currValue => currValue.sort((a, b) => b.count - a.count));
                } catch (error: any) {
                    console.error(error);
                    setReactions(previousReactions);
                }
            });
        }
    }

    const handleEmojiSelect = (emoteId: string) => {
        if (isReactionsChanging) return;
        if (reactions.find((reaction) => reaction.emoteId === emoteId)) {
            return;
        }

        startReactionsChange(async () => {
            try {
                await createContentNoteReaction(profile, category, contentNote.id, emoteId);
                const sameEmote = reactions.find((reaction) => reaction.emoteId === emoteId);
                if (sameEmote) {
                    sameEmote.count++;
                } else {
                    setReactions([...reactions, { emoteId, source: 'unicode_emoji', count: 1, userReacted: true }]);
                }
            } catch (error: any) {
                console.error(error);
                toast({
                    title: "Error adding reaction",
                    description: error.message ?? "An error occurred.",
                });
            }
        });
    }

    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            {reactions.map((reaction) => (
                <Button
                    key={reaction.emoteId}
                    className="rounded-xl px-2 py-1 h-7"
                    onClick={() => handleEmojiClick(reaction.emoteId)}
                    variant={reaction.userReacted ? "default" : "secondary"}
                >
                    <div className="flex items-center gap-1">
                        <div className="text-sm">
                            {reaction.emoteId}
                        </div>
                        <div className="text-md font-semibold">
                            {reaction.count}
                        </div>
                    </div>
                </Button>
            ))}
            {user && canReact() && (
                <Popover>
                    <PopoverTrigger disabled={!canReact()}>
                        <div className="border rounded-xl px-2 py-1 h-7 flex items-center justify-center">
                            {reactions.length === 0 ? (
                                <p className="text-sm font-semibold">
                                    +&nbsp;{randomReactions[Math.floor(Math.random() * randomReactions.length)]}
                                </p>
                            ) : "+"}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit p-0">
                        <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                            <EmojiPicker.Header>
                                <EmojiPicker.Input placeholder="Search emoji" />
                            </EmojiPicker.Header>
                            <EmojiPicker.Group>
                                <EmojiPicker.List />
                            </EmojiPicker.Group>
                        </EmojiPicker>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}
