import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuthStore } from "@/providers/auth-store";
import { AlertTriangleIcon, ChevronsUpDownIcon } from "lucide-react";
import PasswordChangeForm from "./password-change-form";
import { cn } from "@/lib/utils";

type Props = { className?: string };

export default function PasswordChangeElement({ className }: Props) {
    const user = useAuthStore((store) => store.user);
    const emailProvider = user?.identities?.find((i) => i.provider === "email");

    return (
        <Collapsible>
            <div
                className={cn(
                    "flex space-x-4 justify-between items-center",
                    className
                )}
            >
                <div className="flex-1 flex flex-col space-y-2">
                    <div className="flex space-x-2 items-center">
                        <p>Password</p>
                        {!emailProvider && (
                            <AlertTriangleIcon className="w-4 h-4 text-yellow-400" />
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {emailProvider
                            ? "You can change your password at any time. We recommend using a strong password."
                            : "You don't have password set up. You can log in to this account only using third-party providers."}
                    </div>
                </div>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex items-center gap-1"
                    >
                        {emailProvider ? "Change" : "Set up"}&nbsp;
                        <ChevronsUpDownIcon />
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <PasswordChangeForm
                    className="mt-2"
                    needSetUp={!emailProvider}
                />
            </CollapsibleContent>
        </Collapsible>
    );
}
