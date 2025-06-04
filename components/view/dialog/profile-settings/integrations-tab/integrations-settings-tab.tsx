"use client";

import DonatePayIcon from "@/components/ui/icons/donate-pay-icon";
import DonationAlertsIcon from "@/components/ui/icons/donation-alerts-icon";
import StreamElementsIcon from "@/components/ui/icons/stream-elements-icon";
import { toast } from "@/hooks/use-toast";
import { SiStreamlabs, SiTwitch } from "@icons-pack/react-simple-icons";
import IntegrationElement from "./integration-element";

export default function IntegrationsSettingsTab() {

    const handleTwitchConnect = async () => {
        try {
            window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/twitch/connect`;
        } catch (error) {
            toast({
                title: "Failed to refresh authentication cookie",
                description: "Please try again.",
                variant: "destructive",
            });
        }
    }

    return (
        <div className="flex flex-col justify-between h-full space-y-6 w-full">
            <div className="flex flex-col space-y-4">
                <IntegrationElement
                    icon={SiTwitch}
                    title="Twitch"
                    description="You can provide access to channel points redemptions from your Twitch channel to automatically populate your orders."
                    action={handleTwitchConnect}
                />

                <IntegrationElement
                    icon={DonationAlertsIcon}
                    title="DonationAlerts"
                    description="You can provide access to donations from your DonationAlerts account to automatically populate your orders."
                    tbd
                />

                <IntegrationElement
                    icon={DonatePayIcon}
                    title="DonatePay"
                    description="You can provide access to donations from your DonatePay account to automatically populate your orders."
                    tbd
                />

                <IntegrationElement
                    icon={SiStreamlabs}
                    title="Streamlabs"
                    description="You can provide access to donations from your Streamlabs account to automatically populate your orders."
                    tbd
                />

                <IntegrationElement
                    icon={StreamElementsIcon}
                    title="StreamElements"
                    description="You can provide access to donations from your StreamElements account to automatically populate your orders."
                    tbd
                />
            </div>
        </div>
    );
}
