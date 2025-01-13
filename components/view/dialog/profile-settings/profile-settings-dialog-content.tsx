"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LayoutGrid, MessageCircle, Settings, Shield } from "lucide-react";
import React from "react";
import GeneralSettingsTab from "./general-settings-tab";

type SettingsTab = "general" | "security" | "notifications" | "connections";

function TabContent({ tab }: { tab: SettingsTab }) {
    switch (tab) {
        case "general":
            return <GeneralSettingsTab />;
        case "security":
            return <SecurityTab />;
        case "connections":
            return <ConnectionsTab />;
        case "notifications":
            return <NotificationsTab />;
    }

    return <div>Tab content</div>;
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
