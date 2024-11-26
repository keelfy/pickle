"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { StarIcon } from "lucide-react";
import Image from "next/image";

interface Props {
    note: GameNote;
}

export function GameFeedbackCard({ note, ...props }: Props) {
    const statusColors: { color: string; name: string }[] = [
        { name: "Planned", color: "bg-indigo-500" },
        { name: "Playing", color: "bg-blue-500" },
        { name: "Completed", color: "bg-green-500" },
        { name: "Abandoned", color: "bg-red-500" },
        { name: "On Hold", color: "bg-yellow-500" },
        { name: "Skipped", color: "bg-gray-500" },
    ];

    return (
        <Card className="flex" {...props}>
            <div className="flex-0 shrink-0 grow-0 my-6 ml-6 w-100 h-150">
                <Image
                    alt="banner"
                    width={100}
                    height={150}
                    src="/cover-placeholder.png"
                    style={{
                        borderRadius: 3,
                    }}
                    loading="lazy"
                    placeholder="data:image/cover-placeholder.png"
                    onError={(e) =>
                        (e.currentTarget.src = "/cover-placeholder.png")
                    }
                />
            </div>
            <div>
                <CardHeader>
                    <div className="flex flex-col gap-2">
                        <CardTitle className="text-2xl font-bold">
                            {note.gameName}
                        </CardTitle>
                        <div className="flex flex-row items-center justify-start gap-2">
                            <Badge
                                className={`${statusColors[note.status].color} text-white`}
                            >
                                {statusColors[note.status].name}
                            </Badge>
                            {note.finishedAt && (
                                <CardDescription>
                                    Finished:&nbsp;
                                    {new Date(
                                        note.finishedAt
                                    ).toLocaleDateString()}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                </CardHeader>
                {note.status != 0 && (
                    <CardContent>
                        <div className="flex items-center mb-4">
                            <div className="flex items-center">
                                {[...Array(10)].map((_, i) => (
                                    <StarIcon
                                        key={i}
                                        className={`w-5 h-5 ${
                                            i < note.rate
                                                ? "text-yellow-400 fill-current"
                                                : "text-gray-300"
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="ml-2 font-semibold">
                                {note.rate}/10
                            </span>
                        </div>
                        {note.comment && (
                            <p className="text-sm text-muted-foreground">
                                {note.comment}
                            </p>
                        )}
                    </CardContent>
                )}
            </div>
        </Card>
    );
}
