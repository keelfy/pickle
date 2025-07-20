import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/utils/api/client";
import { BroadcasterPreferences, ContentCategory, TwitchChannelReward } from "@/utils/api/types";
import { CuboidIcon, LinkIcon, LoaderIcon, PlugIcon, RefreshCwIcon, UnlinkIcon, UnplugIcon } from "lucide-react";
import React from "react";
import ChannelRewardItem from "./channel-reward-item";
import { BroadcasterPreferencesReq, TrackedRewardReq } from "@/utils/api/request";

export default function TwitchIntegrationSettings() {

    const [isFlowPending, startFlowTransition] = React.useTransition();
    const [preferences, setPreferences] = React.useState<BroadcasterPreferences>();

    const [trackingStatus, setTrackingStatus] = React.useState<"healthy" | "issues" | "loading">("loading");
    const [isPending, startTransition] = React.useTransition();

    React.useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = () => startTransition(async () => {
        try {
            const res = await fetchApi<BroadcasterPreferences>("/twitch-harbor/v1/broadcaster/preferences");
            setPreferences(res);
            setTrackingStatus(res.rewards.isActive ? "healthy" : "issues");
        } catch (e) {
            console.error(e);
            setTrackingStatus("issues");
        }
    });

    const savePreferences = () => startTransition(async () => {
        if (!preferences?.rewards.trackedRewards) return;
        const trackedRewards = preferences?.rewards.trackedRewards.map(r => ({
            rewardId: r.id,
            category: r.category || "any",
        } as TrackedRewardReq));
        const req: BroadcasterPreferencesReq = {
            rewards: {
                trackedRewards,
            },
        };
        try {
            await fetchApi(`/twitch-harbor/v1/broadcaster/preferences`, true, {
                method: "POST",
                body: JSON.stringify(req),
            });
        } catch (e) {
            console.error(e);
        }
    });

    const handleTrackReward = (reward: TwitchChannelReward, category: ContentCategory | undefined) => {
        setPreferences(prev => prev && {
            ...prev,
            rewards: {
                ...prev.rewards,
                trackedRewards: [...prev.rewards.trackedRewards, {
                    ...reward,
                    category,
                }],
                availableRewards: prev.rewards.availableRewards.filter(r => r.id !== reward.id),
            }
        });
    }

    const handleUntrackReward = (reward: TwitchChannelReward) => {
        setPreferences(prev => prev && {
            ...prev,
            rewards: {
                ...prev.rewards,
                trackedRewards: prev.rewards.trackedRewards.filter(r => r.id !== reward.id),
                availableRewards: [...prev.rewards.availableRewards, reward],
            }
        });
    }

    return (
        <>
            <div className="grid gap-2">
                <div className="grid gap-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <PlugIcon className="w-4 h-4" />
                            <h2 className="text-md font-bold">Tracked Rewards</h2>
                        </div>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant={trackingStatus === "healthy" ? "default" : "destructive"} className={cn("flex-0", trackingStatus === "healthy" && "animate-pulse")}>
                                    {['loading', 'healthy'].includes(trackingStatus) ? "Tracking is healthy" : "Tracking issues detected"}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side='left'>
                                This badge shows if our server is connected<br />
                                to updates from Twitch for reward redemptions.
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        You can start to track reward redemptions by clicking the link button next to an available reward in the <span className="font-bold">Available Rewards</span> section.
                    </p>
                </div>
                <ScrollArea className="h-48 pr-4">
                    <div className="grid gap-2">
                        {preferences?.rewards.trackedRewards && preferences.rewards.trackedRewards.length > 0 ? preferences.rewards.trackedRewards.map((reward: any) => (
                            <ChannelRewardItem
                                key={reward.id}
                                reward={reward}
                                isPending={isPending}
                                handleClick={handleUntrackReward}
                                isTracked={true}
                            />
                        )) : (
                            <p className="text-sm text-center h-48 flex items-center justify-center">
                                No rewards are currently being tracked 😔
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <div className="grid gap-2">
                <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                        <CuboidIcon className="w-4 h-4" />
                        <h2 className="text-md font-bold">Available Rewards</h2>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <span className="font-bold">Note:</span> You can only track rewards that require user input. Rewards that don't require user input won't be shown here.
                    </p>
                </div>
                <ScrollArea className="h-48 pr-4">
                    <div className="grid gap-2">
                        {preferences?.rewards.availableRewards && preferences.rewards.availableRewards.length > 0 ? preferences.rewards.availableRewards.map((reward: any) => (
                            <ChannelRewardItem
                                key={reward.id}
                                reward={reward}
                                isPending={isPending}
                                handleClick={handleTrackReward}
                                isTracked={false}
                            />
                        )) : (
                            <div className="flex flex-col items-center justify-center h-48">
                                <p className="text-sm text-center">
                                    No suitable rewards found 😔<br />
                                    You can add a reward to your channel by visiting the <a href="https://www.twitch.tv/settings/channel/rewards" target="_blank" rel="noopener noreferrer" className="underline">Twitch dashboard</a>.
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <Button onClick={savePreferences} disabled={isPending} className="w-full">Save changes</Button>
        </>
    );
}