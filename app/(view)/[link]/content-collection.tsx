"use client";

import { Button } from "@/components/ui/button";
import ContentPoster from "@/components/ui/content-poster";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, PencilIcon, PenIcon, PlusIcon, SettingsIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

function CollectionItem({ posterUrl, contentName }: { posterUrl: string | undefined, contentName: string }) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Link href="/" className="hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-md">
                        <ContentPoster posterUrl={posterUrl} size="sm" className="cursor-pointer" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>{contentName}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export function CreateCollection() {
    return (
        <div className="flex items-center">
            <Button variant='link' className="text-start flex items-center flex-shrink-0 gap-2 p-0 text-muted-foreground">
                <PlusIcon />
                <h2 className="text-md">Add collection of content</h2>
            </Button>
            <Separator className="flex-1 ml-2" />
        </div>
    )
}

export default function ContentCollection({ name, icon }: { name: string, icon: React.ReactNode }) {
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center">
                <Button variant='link' className="text-start flex items-center flex-shrink-0 gap-2 p-0" onClick={() => setCollapsed(!collapsed)}>
                    {icon}
                    <h2 className="text-lg font-semibold">{name}</h2>
                </Button>
                <Separator className="flex-1 mx-2" />
                <div className="flex items-center gap-0">
                    <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
                        <ChevronDownIcon className={cn("transition-transform duration-300", collapsed && "rotate-90")} />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <PencilIcon />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                        <TrashIcon />
                    </Button>
                </div>
            </div>
            <div className={cn("flex items-center gap-2", collapsed && "hidden")}>
                {Array.from({ length: Math.floor(Math.random() * 6) + 1 }).map((_, index) => (
                    <CollectionItem key={index} posterUrl={undefined} contentName="This is a content name" />
                ))}
            </div>
        </div>
    )
}
