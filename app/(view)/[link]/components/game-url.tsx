"use client";

import { cn } from "@/utils/cn";
import Image from "next/image";
import React from "react";

type Props = {
    url?: string;
    className?: string;
};

const GameUrl = ({ url, className }: Props) => {
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
            setFaviconUrl(undefined);
        }
    };

    React.useEffect(() => {
        handleLoadFavicon();
    }, [url]);

    return (
        <div className={cn(className, "flex text-sm items-center")}>
            {faviconUrl && (
                <Image
                    src={faviconUrl ?? null}
                    alt="Link favicon"
                    className="flex-shrink-0"
                    width={16}
                    height={16}
                />
            )}
            {url && url.length > 0 ? (
                <p
                    className={cn(
                        "truncate text-end text-muted-foreground",
                        faviconUrl ? "w-20" : "w-24"
                    )}
                    dir="rtl"
                >
                    <span className="text-xs">{url}</span>
                </p>
            ) : (
                <>&mdash;</>
            )}
        </div>
    );
};

export default GameUrl;
