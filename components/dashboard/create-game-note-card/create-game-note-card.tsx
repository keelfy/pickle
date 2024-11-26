"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { fetchWithAuth } from "@/utils/api/client";

const baseSchema = z.object({
    gameName: z
        .string()
        .min(2, {
            message: "Name of the game should include at least 2 characters",
        })
        .max(500, {
            message: "Name of the game can't be more than 500 characters",
        }),
    comment: z.string().optional(),
});

const schemaForFinishedGame = z.object({
    status: z.enum(["completed", "abandoned"]),
    finishedAt: z.date(),
    rate: z.preprocess(
        (x) => Number(x),
        z
            .number()
            .min(1, { message: "Min rating is 1" })
            .max(10, { message: "Max rating is 10" })
    ),
});

const schemaForNotFinishedGame = z.object({
    status: z.enum(["planned", "playing", "on_hold", "skipped"]),
    finishedAt: z.date().optional(),
    rate: z
        .preprocess(
            (x) => Number(x),
            z
                .number()
                .min(1, { message: "Min rating is 1" })
                .max(10, { message: "Max rating is 10" })
        )
        .optional(),
});

const formSchema = z
    .discriminatedUnion("status", [
        schemaForFinishedGame,
        schemaForNotFinishedGame,
    ])
    .and(baseSchema);

const statuses = [
    "planned",
    "playing",
    "completed",
    "abandoned",
    "on_hold",
    "skipped",
];

const CreateGameNoteCard = () => {
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const req = {
            gameName: values.gameName,
            status: statuses.findIndex((x) => x === values.status) ?? 0,
            finishedAt: values.finishedAt?.toISOString(),
            rate: values.rate,
            comment: values.comment,
        };
        fetchWithAuth("/v1/game-notes", {
            method: "POST",
            body: JSON.stringify(req),
        });
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: "planned",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="w-full max-w-md mx-auto mb-6">
                    <CardHeader>
                        <CardTitle>New note</CardTitle>
                        <CardDescription>
                            Create a new note about your latest game experience
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="grid w-full items-center gap-4">
                            <FormField
                                control={form.control}
                                name="gameName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Cyberpunk 2077"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Name of the Game you're writing
                                            about
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Playthrough Status
                                        </FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <SelectTrigger id="playthrough_status">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    <SelectItem value="planned">
                                                        Planning to play
                                                    </SelectItem>
                                                    <SelectItem value="playing">
                                                        Playing
                                                    </SelectItem>
                                                    <SelectItem value="on_hold">
                                                        On Hold
                                                    </SelectItem>
                                                    <SelectItem value="completed">
                                                        Completed
                                                    </SelectItem>
                                                    <SelectItem value="abandoned">
                                                        Abandoned (will not
                                                        finish it)
                                                    </SelectItem>
                                                    <SelectItem value="skipped">
                                                        Skipped (won't even try)
                                                    </SelectItem>
                                                    <SelectItem value="banned">
                                                        Banned (can't play it)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="finishedAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            When you finished?
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[280px] justify-start text-left font-normal",
                                                            !field.value &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? (
                                                            format(
                                                                field.value,
                                                                "PPP"
                                                            )
                                                        ) : (
                                                            <span>
                                                                Pick a date
                                                            </span>
                                                        )}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            When you completed or decided to
                                            abandon the game
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rate</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="5"
                                                type="number"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Rate this game from 1 to 10
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Comment</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="I REALLY liked the game"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Describe your emotions after
                                            playthrough
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="reset">
                            Reset
                        </Button>
                        <Button type="submit">Add</Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
};

export default CreateGameNoteCard;
