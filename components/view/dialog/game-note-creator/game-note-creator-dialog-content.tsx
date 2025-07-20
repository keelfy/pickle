"use client";

import { Button } from "@/components/ui/button";
import ContentNotePoster from "@/components/ui/content-note/content-note-poster";
import {
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormField
} from "@/components/ui/form";
import IGDBIcon from "@/components/ui/icons/igdb-icon";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    createContentNote,
    fetchGameById
} from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { useModalStore } from "@/providers/modal";
import { useProfileStore } from "@/providers/profile-store";
import { gameNoteStatusLabels } from "@/utils/api/constants";
import { CreateGameNoteReq } from "@/utils/api/request";
import { Game, GameNote, GameNoteStatus, ContentWebsite } from "@/utils/api/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { SiDiscord, SiDiscordHex, SiItchdotio, SiItchdotioHex, SiReddit, SiRedditHex, SiSteam, SiSteamHex, SiTwitch, SiTwitchHex, SiWikipedia, SiWikipediaHex, SiYoutube, SiYoutubeHex } from "@icons-pack/react-simple-icons";
import {
    Check,
    CheckIcon,
    CircleOff,
    HistoryIcon,
    RocketIcon,
    X
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CommentFormItem from "../content-note-editor/comment-form-item";
import DayPickerFormItem from "../content-note-editor/day-picker-form-item";
import RateFormItem from "../content-note-editor/rate-form-item";
import StatusSelectFormItem from "../content-note-editor/status-select-form-item";
import { NoteDialogOrdersSection } from "../note-dialog-orders-section";
import { GameNoteCreatorDialogParams } from "./game-note-creator-dialog";

const formSchema = z.object({
    status: z.custom<GameNoteStatus>(),
    lastPlayedAt: z.date().optional(),
    comment: z.string().optional(),
    rate: z.number().max(10).min(1).optional(),
    contentId: z.string(),
});

type Props = GameNoteCreatorDialogParams;

export const getSourceLinks = (websites: ContentWebsite[]) => websites?.map(w => {
    switch (w.type.toLowerCase()) {
        case 'steam':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiSteam className="size-5 dark:invert" color={SiSteamHex} />
                </Link>
            );
        case 'wikipedia':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiWikipedia className="size-5 dark:invert" color={SiWikipediaHex} />
                </Link>
            );
        case 'itch':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiItchdotio className="size-5" color={SiItchdotioHex} />
                </Link>
            );
        case 'twitch':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiTwitch className="size-5" color={SiTwitchHex} />
                </Link>
            );
        case 'subreddit':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiReddit className="size-5" color={SiRedditHex} />
                </Link>
            );
        case 'youtube':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiYoutube className="size-5" color={SiYoutubeHex} />
                </Link>
            );
        case 'discord':
            return (
                <Link href={w.url} target="_blank" key={w.type}>
                    <SiDiscord className="size-5" color={SiDiscordHex} />
                </Link>
            );
    }
})

export default function GameNoteCreatorDialogContent({ gameId }: Props) {
    const closeModal = useModalStore((state) => state.closeModal);
    const profile = useProfileStore((state) => state.profile);

    const [game, setGame] = React.useState<Game>();
    const [isLoading, startTransition] = React.useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: "planned",
            comment: "",
            rate: undefined,
            contentId: gameId,
        },
    });

    React.useEffect(() => {
        if (game) {
            form.reset({
                status: 'planned',
                lastPlayedAt: undefined,
                comment: "",
                rate: undefined,
                contentId: gameId,
            });
        } else {
            form.reset();
        }
    }, [game?.id]);

    React.useEffect(() => {
        if (!gameId || !profile?.id) return;
        fetchGameById(gameId, 'lg')
            .then(setGame)
            .catch((err) => {
                console.error(err);
                toast({
                    title: "Failed to fetch game",
                    description: "Try again later.",
                });
            });
    }, [gameId, profile?.id]);

    const onSubmit = form.handleSubmit((values) => {
        if (!profile?.id) return;

        startTransition(async () => {
            try {
                await createContentNote<GameNote, CreateGameNoteReq>(
                    profile,
                    "games",
                    values
                );
                toast({
                    title: game?.title ?? "Untitled game",
                    description: "The game note was created.",
                });
                closeModal();
            } catch (error: any) {
                toast({
                    title: "Failed to create game note",
                    description: error.message ?? "An error occurred.",
                    variant: "destructive",
                });
            }
        });
    });

    return (
        <>
            <div className="hidden">
                <DialogHeader>
                    <DialogTitle>{game?.title}</DialogTitle>
                </DialogHeader>
            </div>

            <Form {...form}>
                <form onSubmit={onSubmit}>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <ContentNotePoster
                                posterUrl={game?.coverUrl?.replace("t_thumb", "t_cover_big")}
                                size="md"
                                loading={isLoading}
                            />
                            <div className="grid min-h-[225px] w-full">
                                <div className="flex flex-col gap-0">
                                    <div className="font-bold text-lg line-clamp-3">
                                        {game?.title}
                                    </div>
                                    {game?.releaseDate && (
                                        <div className="text-sm whitespace-nowrap flex items-center gap-1">
                                            <RocketIcon className="size-3" />
                                            {new Date(game?.releaseDate).toLocaleDateString(
                                                undefined,
                                                {
                                                    year: "numeric"
                                                }
                                            )}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <div className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
                                            <CheckIcon size={12} />
                                            Status
                                        </div>
                                        <div>
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <StatusSelectFormItem
                                                        field={field}
                                                        options={
                                                            gameNoteStatusLabels
                                                        }
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
                                            <HistoryIcon size={12} />
                                            Last played
                                        </div>
                                        <div>
                                            <FormField
                                                control={form.control}
                                                name="lastPlayedAt"
                                                render={({ field }) => (
                                                    <DayPickerFormItem
                                                        field={field}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-auto mb-1">
                                    {game?.sourceUrl && (
                                        <Link href={game?.sourceUrl} target="_blank">
                                            <IGDBIcon className="w-12" />
                                        </Link>
                                    )}
                                    {game?.websites && getSourceLinks(game.websites)}
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="rate"
                            render={({ field }) => (
                                <RateFormItem field={field} />
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <CommentFormItem field={field} />
                            )}
                        />

                        <div className="space-y-2 hidden">
                            <Label className="text-md font-semibold">
                                Recordings/Highlights
                            </Label>
                            <ScrollArea className="max-w-[29rem] whitespace-nowrap">
                                <div className="flex space-x-2 pb-4">
                                    {Array.from({ length: 10 }).map(
                                        (_, index) => (
                                            <div
                                                key={index}
                                                className="w-[192px] h-[108px] bg-white rounded-sm"
                                            />
                                        )
                                    )}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>

                        {gameId && (
                            <NoteDialogOrdersSection
                                noteId={gameId}
                                category="games"
                            />
                        )}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="destructive"
                            type="button"
                            onClick={closeModal}
                        >
                            <X />
                            Cancel
                        </Button>
                        {gameId && (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => form.reset()}
                                disabled={isLoading || !form.formState.isDirty}
                            >
                                <CircleOff />
                                Reset
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <LoadingSpinner /> : <Check />}
                            {gameId ? "Confirm" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form >
        </>
    );
}
