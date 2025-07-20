import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { SettingsFlow } from "@ory/client-fetch";
import { ChevronsUpDownIcon } from "lucide-react";
import PasswordChangeForm from "./password-change-form";

type Props = {
    className?: string;
    flow: SettingsFlow | undefined;
    isFlowPending: boolean;
    updateFlow: (flow: SettingsFlow) => void;
};

export default function PasswordChangeElement({ className, flow, isFlowPending, updateFlow }: Props) {
    return (
        <Collapsible>
            <div
                className={cn(
                    "flex space-x-4 justify-between items-center",
                    className
                )}
            >
                <div className="flex-1 flex flex-col space-y-2">
                    <p className="flex space-x-2 items-center">
                        Password
                    </p>
                    <p className="text-xs text-muted-foreground">
                        You can change your password at any time. We recommend using a strong password.
                        {/* You don't have password set up. You can log in to this account only using third-party providers. */}
                    </p>
                </div>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex items-center gap-1"
                        disabled={isFlowPending}
                    >
                        Change
                        {isFlowPending ? <LoadingSpinner /> : <ChevronsUpDownIcon />}
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <PasswordChangeForm
                    className="mt-2"
                    flow={flow}
                    isFlowPending={isFlowPending}
                    updateFlow={updateFlow}
                />
            </CollapsibleContent>
        </Collapsible>
    );
}
