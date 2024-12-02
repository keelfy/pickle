"use client";

import { cn } from "@/utils/cn";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {
    url?: string;
};

const GameLink = ({ url }: Props) => {
    const [faviconUrl, setFaviconUrl] = React.useState<string>();

    const handleLoadFavicon = () => {
        if (!url) {
            setFaviconUrl(undefined);
            return;
        }

        try {
            const parsedUrl = new URL(url);
            const favicon = `${parsedUrl.origin}/favicon.ico`;
            setFaviconUrl(favicon);
        } catch (error) {
            alert("Please enter a valid URL");
            setFaviconUrl(undefined);
        }
    };

    React.useEffect(() => {
        handleLoadFavicon();
    }, [url]);

    return (
        <Link
            href={url ?? "#"}
            target="_blank"
            className="flex items-center space-x-0.5 text-sm text-muted-foreground"
        >
            {faviconUrl && (
                <>
                    <Image
                        src={faviconUrl ?? null}
                        alt="Link favicon"
                        className="w-4 h-4 flex-shrink-0"
                        width={16}
                        height={16}
                    />
                    <span>/</span>
                </>
            )}
            <p
                className={cn("truncate", faviconUrl ? "w-16" : "w-20")}
                dir="rtl"
            >
                <span className="text-xs">{url}</span>
            </p>
        </Link>
    );
};

export default GameLink;
