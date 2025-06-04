"use client";

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useModalStore } from "@/providers/modal";
import {
    CreditCardIcon,
    HandshakeIcon,
    LayoutGrid,
    LightbulbIcon,
    MessageCircle,
    Settings,
    Shield,
} from "lucide-react";
import React from "react";
import { default as ProfileSettingsTabButton } from "./tab-button";
import TabContent, { ProfileSettingsDialogTab } from "./tab-content";
import { TooltipProvider } from "@/components/ui/tooltip";

type Tab = {
    value: ProfileSettingsDialogTab;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
};

const tabCategories: { name: string; tabs: Tab[] }[] = [
    {
        name: "Profile",
        tabs: [
            { value: "general", icon: <Settings />, label: "General" },
            {
                value: "suggestions",
                icon: <LightbulbIcon />,
                label: "Suggestions",
            },
            {
                value: "moderation",
                icon: <HandshakeIcon />,
                label: "Moderation",
            },
        ],
    },
    {
        name: "Account",
        tabs: [
            { value: "security", icon: <Shield />, label: "Security" },
            {
                value: "integrations",
                icon: <LayoutGrid />,
                label: "Integrations",
            },
            {
                value: "payments",
                icon: <CreditCardIcon />,
                label: "Payments",
                disabled: true,
            },
            {
                value: "notifications",
                icon: <MessageCircle />,
                label: "Notifications",
                disabled: true,
            },
        ],
    },
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
            <TooltipProvider>
                <div className="flex space-x-6 p-6">
                    <div className="flex flex-col space-y-2">
                        {tabCategories.map((category) => (
                            <div
                                key={category.name}
                                className="flex flex-col space-y-2"
                            >
                                <h2 className="text-xs text-muted-foreground">
                                    {category.name}
                                </h2>
                                <div className="flex flex-col space-y-2">
                                    {category.tabs.map((tab) => (
                                        <ProfileSettingsTabButton
                                            key={tab.value}
                                            active={tab.value == currentTab}
                                            onClick={() =>
                                                handleTabClick(tab.value)
                                            }
                                            icon={tab.icon}
                                            label={tab.label}
                                            disabled={tab.disabled}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <TabContent tab={currentTab} />
                </div>
            </TooltipProvider>
        </>
    );
}
