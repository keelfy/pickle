"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/providers/auth-store";
import { fetchApi } from "@/utils/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Check,
    CircleOff,
    LayoutGrid,
    MessageCircle,
    Settings,
    Shield,
    X,
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type SettingsTab = "general" | "security" | "notifications" | "connections";

function TabContent({ tab }: { tab: SettingsTab }) {
    switch (tab) {
        case "general":
            return <GeneralTab />;
        case "security":
            return <SecurityTab />;
        case "connections":
            return <ConnectionsTab />;
        case "notifications":
            return <NotificationsTab />;
    }

    return <div>Tab content</div>;
}

function GeneralTab() {
    const { profile, updateProfile } = useAuthStore((state) => state);
    const [isLoading, startTransition] = React.useTransition();
    const [linkValidation, setLinkValidation] =
        React.useState<LinkValidation>();

    const formSchema = z.object({
        username: z.string(),
        link: z.string(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            link: "",
        },
    });

    // Validate a link with debounce of 200 ms
    React.useEffect(() => {
        const link = form.watch("link");
        if (link === profile?.link) {
            form.clearErrors("link");
            setLinkValidation(undefined);
            return;
        }

        const getData = setTimeout(async () => {
            try {
                const res = await fetchApi<LinkValidation>(
                    `/v1/profiles/validate-link?link=${form.watch("link")}`
                );
                setLinkValidation(res);
                if (res.valid) {
                    form.clearErrors("link");
                } else {
                    form.setError("link", {
                        message: res.message,
                    });
                }
            } catch (error: any) {
                toast({
                    title: "Failed to validate link",
                    description: error.message,
                });
            }
        }, 500);
        return () => clearTimeout(getData);
    }, [form.watch("link")]);

    React.useEffect(() => {
        resetForm();
    }, [profile]);

    const onSubmit = async (data: z.infer<typeof formSchema>) =>
        startTransition(async () => {
            try {
                const res = await fetchApi<Profile>("/v1/profiles/me", true, {
                    method: "PATCH",
                    body: JSON.stringify(data),
                });
                updateProfile(res);
            } catch (error: any) {
                toast({
                    title: "Failed to update settings",
                    description: error.message,
                });
            }
        });

    const resetForm = () => {
        form.reset({ ...profile });
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col justify-between h-full space-y-6 w-full"
            >
                <div className="flex flex-col space-y-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Profile name</Label>
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <Input placeholder="Jane Doe" {...field} />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Link to your page</Label>
                        <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex">
                                        <div className="text-sm flex items-center justify-center px-2 border border-r-0 rounded-l-md bg-primary-foreground">
                                            pickle.pw/
                                        </div>
                                        <Input
                                            className="rounded-l-none"
                                            placeholder="jane-doe"
                                            {...field}
                                        />
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center relative -left-8">
                                                        {!form.getFieldState(
                                                            "link"
                                                        ).invalid ? (
                                                            <Check
                                                                size={16}
                                                                className="text-green-500"
                                                            />
                                                        ) : (
                                                            <X
                                                                size={16}
                                                                className="text-red-500"
                                                            />
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {linkValidation?.message ??
                                                        "Link is valid"}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        onClick={resetForm}
                        type="button"
                        disabled={!form.formState.isDirty}
                    >
                        <CircleOff />
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !form.formState.isDirty}
                    >
                        {isLoading ? <LoadingSpinner /> : <Check />}
                        Confirm
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function SecurityTab() {
    return <div>Security tab</div>;
}

function ConnectionsTab() {
    return <div>Connections tab</div>;
}

function NotificationsTab() {
    return <div>Notifications tab</div>;
}

export default function ProfileSettingsDialogContent() {
    const [tab, setTab] = React.useState<SettingsTab>("general");

    function TabButton({
        forTab,
        icon,
        label,
    }: {
        forTab: SettingsTab;
        icon: React.ReactNode;
        label: string;
    }) {
        return (
            <Button
                variant={forTab == tab ? "default" : "ghost"}
                onClick={() => setTab(forTab)}
                className="w-full flex items-center justify-start gap-1 text-sm"
            >
                {icon}
                {label}
            </Button>
        );
    }

    return (
        <>
            <DialogHeader className="h-12">
                <DialogTitle className="flex items-center h-full pl-6">
                    Settings
                </DialogTitle>
            </DialogHeader>
            <Separator />
            <div className="flex space-x-6 p-6">
                <div className="flex flex-col space-y-2">
                    <TabButton
                        forTab="general"
                        icon={<Settings />}
                        label="General"
                    />
                    <TabButton
                        forTab="security"
                        icon={<Shield />}
                        label="Security"
                    />
                    <TabButton
                        forTab="connections"
                        icon={<LayoutGrid />}
                        label="Integrations"
                    />
                    <TabButton
                        forTab="notifications"
                        icon={<MessageCircle />}
                        label="Notifications"
                    />
                </div>
                <TabContent tab={tab} />
            </div>
        </>
    );
}
