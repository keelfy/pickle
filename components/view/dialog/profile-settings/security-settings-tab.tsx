"use client";

import { logOutAllDevicesAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/providers/auth-store";
import { ChevronsUpDown, EyeIcon, EyeOffIcon } from "lucide-react";
import React from "react";
import EmailChangeForm from "./email-change-form";
import PasswordChangeForm from "./password-change-form";

export default function SecuritySettingsTab() {
    const user = useAuthStore((state) => state.user);
    const [emailHidden, setEmailHidden] = React.useState(true);
    const [isLoggingOutAll, startLogOutAll] = React.useTransition();

    const logOutAll = () =>
        startLogOutAll(() =>
            logOutAllDevicesAction().catch(() => {
                toast({
                    title: "Failed to log out all devices",
                    description: "Please try again later.",
                });
            })
        );

    return (
        <div className="flex flex-col justify-between h-full space-y-6 w-full">
            <div className="flex flex-col space-y-6">
                <Collapsible>
                    <div className="flex space-x-4 justify-between items-center">
                        <div className="flex-1 flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                {emailHidden ? (
                                    <div>
                                        {user?.email?.split("@")[0].slice(0, 1)}
                                        {(user?.email?.split("@")[0].length ??
                                            0) > 2 && "..."}
                                        {user?.email?.split("@")[0].slice(-1)}@
                                        {user?.email?.split("@")[1]}
                                    </div>
                                ) : (
                                    user?.email
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => setEmailHidden(!emailHidden)}
                                >
                                    {emailHidden ? (
                                        <EyeIcon size={12} />
                                    ) : (
                                        <EyeOffIcon size={12} />
                                    )}
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Your email address is used to log in and send
                                you notifications.
                            </div>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center gap-1"
                            >
                                Change <ChevronsUpDown />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                        <EmailChangeForm className="mt-2" />
                    </CollapsibleContent>
                </Collapsible>

                <Collapsible>
                    <div className="flex space-x-4 justify-between items-center">
                        <div className="flex-1 flex flex-col space-y-2">
                            <div>Password</div>
                            <div className="text-xs text-muted-foreground">
                                You can change your password at any time. We
                                recommend using a strong password.
                            </div>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center gap-1"
                            >
                                Change <ChevronsUpDown />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                        <PasswordChangeForm className="mt-2" />
                    </CollapsibleContent>
                </Collapsible>

                <div className="flex space-x-4 justify-between items-center">
                    <div className="flex-1 flex flex-col space-y-2">
                        <div>MFA</div>
                        <div className="text-xs text-muted-foreground">
                            You can enable multi-factor authentication to add an
                            extra layer of security to your account.
                        </div>
                    </div>
                    <Button variant="outline" disabled>
                        Set up
                    </Button>
                </div>
                <div className="flex space-x-4 justify-between items-center">
                    <div className="flex-1 flex flex-col space-y-2">
                        <div>Log out of all devices</div>
                        <div className="text-xs text-muted-foreground">
                            Log out of all active sessions across all devices,
                            including your current session.
                        </div>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={logOutAll}
                        disabled={isLoggingOutAll}
                    >
                        Log out all
                    </Button>
                </div>
            </div>
        </div>
    );
}
