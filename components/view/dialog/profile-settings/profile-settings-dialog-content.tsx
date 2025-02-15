"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useModalStore } from "@/providers/modal";
import {
    HandshakeIcon,
    LayoutGrid,
    MessageCircle,
    Settings,
    Shield
} from "lucide-react";
import React from "react";
import TabContent, { ProfileSettingsDialogTab } from "./tab-content";

export default function ProfileSettingsDialogContent() {
    const { modalParams, setModalParams } = useModalStore((state) => state);
    const [tab, setTab] = React.useState<ProfileSettingsDialogTab>(
        modalParams?.tab ?? "general"
    );

    function TabButton({
        forTab,
        icon,
        label,
    }: {
        forTab: ProfileSettingsDialogTab;
        icon: React.ReactNode;
        label: string;
    }) {
        return (
            <Button
                variant={forTab == tab ? "default" : "ghost"}
                onClick={() => {
                    setTab(forTab);
                    setModalParams({ tab: forTab });
                }}
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
                        forTab="moderation"
                        icon={<HandshakeIcon />}
                        label="Moderation"
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
