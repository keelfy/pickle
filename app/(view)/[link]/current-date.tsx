"use client";

import React from "react";

export default function CurrentDate() {
    const [mounted, setMounted] = React.useState(false);
    const [date, setDate] = React.useState(new Date());

    React.useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setDate(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!mounted) {
        return (
            <div className="flex flex-col items-end space-y-0.5">
                <div className="text-sm bg-muted animate-pulse rounded w-12 h-4" />
                <div className="text-xs bg-muted animate-pulse rounded w-16 h-3" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end -space-y-0.5">
            <div className="text-sm">
                {date.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </div>
            <div className="text-xs text-muted-foreground">
                {date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                })}
            </div>
        </div>
    );
}
