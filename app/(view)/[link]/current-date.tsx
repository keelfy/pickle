"use client";

import React from "react";

export default function CurrentDate() {
    const [date, setDate] = React.useState(new Date());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setDate(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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
