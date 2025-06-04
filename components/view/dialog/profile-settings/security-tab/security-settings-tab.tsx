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
import { SiDiscord, SiGoogle, SiTwitch } from "@icons-pack/react-simple-icons";
import {
    AlertOctagonIcon,
    ChevronsUpDown,
    EyeIcon,
    EyeOffIcon,
    LogOutIcon,
    UsersIcon
} from "lucide-react";
import React from "react";
import EmailChangeForm from "./email-change-form";
import ProviderIdentityElement from "./identity-element";
import MFAElement from "./mfa-element";
import PasswordChangeElement from "./password-change-element";

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

                <PasswordChangeElement />

                <MFAElement />

                <div className="flex flex-col space-y-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <UsersIcon className="w-5 h-5" />
                        Linked accounts
                    </h2>

                    <ProviderIdentityElement
                        providerType="google"
                        providerName="Google"
                        providerIcon={SiGoogle}
                        providerColor="4285F4"
                    />

                    <ProviderIdentityElement
                        providerType="twitch"
                        providerName="Twitch"
                        providerIcon={SiTwitch}
                        providerColor="6441A5"
                    />

                    <ProviderIdentityElement
                        providerType="discord"
                        providerName="Discord"
                        providerIcon={SiDiscord}
                        providerColor="7289DA"
                    />
                </div>

                <div className="flex flex-col space-y-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <AlertOctagonIcon className="w-5 h-5" />
                        Dangerous space
                    </h2>
                    <div className="flex space-x-4 justify-between items-center">
                        <div className="flex-1 flex flex-col space-y-2">
                            <div className="flex-1 flex items-center space-x-2 text-sm">
                                <LogOutIcon className="w-3 h-3" />
                                <p className="font-mono">
                                    Log out of all devices
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Log out of all active sessions across all
                                devices, including your current session.
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
        </div>
    );
}
