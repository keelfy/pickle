"use client";

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useModalStore } from "@/providers/modal";
import {
    HandshakeIcon,
    LayoutGrid,
    LightbulbIcon,
    MessageCircle,
    Settings,
    Shield
} from "lucide-react";
import React from "react";
import { default as ProfileSettingsTabButton } from "./tab-button";
import TabContent, { ProfileSettingsDialogTab } from "./tab-content";

type Tab = {
    value: ProfileSettingsDialogTab;
    icon: React.ReactNode;
    label: string;
}

const tabs: Tab[] = [
    {
        value: "general",
        icon: <Settings />,
        label: "General"
    },
    {
        value: "security",
        icon: <Shield />,
        label: "Security"
    },
    {
        value: "connections",
        icon: <LayoutGrid />,
        label: "Integrations"
    },
    {
        value: "suggestions",
        icon: <LightbulbIcon />,
        label: "Suggestions"
    },
    {
        value: "moderation",
        icon: <HandshakeIcon />,
        label: "Moderation"
    },
    {
        value: "notifications",
        icon: <MessageCircle />,
        label: "Notifications"
    }
];

export default function ProfileSettingsDialogContent() {
    const { modalParams, setModalParams } = useModalStore((state) => state);
    const [currentTab, setTab] = React.useState<ProfileSettingsDialogTab>(
        modalParams?.tab ?? "general"
    );

    const handleTabClick = (tab: ProfileSettingsDialogTab) => {
        setTab(tab);
        setModalParams({ tab });
    };

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
                    {tabs.map((tab) => (
                        <ProfileSettingsTabButton
                            key={tab.value}
                            tab={tab.value}
                            active={tab.value == currentTab}
                            onClick={() => handleTabClick(tab.value)}
                            icon={tab.icon}
                            label={tab.label}
                        />
                    ))}
                </div>
                <TabContent tab={currentTab} />
            </div>
        </>
    );
}
