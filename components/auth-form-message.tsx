import { cn } from "@/utils/cn";

export type Message =
    | { success: string }
    | { error: string }
    | { message: string };

type Props = {
    message: Message;
    className?: string;
};

export function AuthFormMessage({ message, className }: Props) {
    return (
        <div
            className={cn(
                "flex flex-col gap-2 w-full max-w-md text-sm",
                className
            )}
        >
            {"success" in message && (
                <div className="text-foreground border-l-2 border-foreground px-4">
                    {message.success}
                </div>
            )}
            {"error" in message && (
                <div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4">
                    {message.error}
                </div>
            )}
            {"message" in message && (
                <div className="text-foreground border-l-2 px-4">
                    {message.message}
                </div>
            )}
        </div>
    );
}
