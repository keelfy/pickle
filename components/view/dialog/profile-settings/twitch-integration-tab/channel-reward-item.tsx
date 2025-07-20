import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localizeContentCategory } from "@/lib/localize-types";
import { cn } from "@/lib/utils";
import { contentCategoryLabels } from "@/utils/api/constants";
import { CONTENT_CATEGORIES, ContentCategory, TwitchChannelReward } from "@/utils/api/types";
import { LinkIcon, UnlinkIcon } from "lucide-react";
import React from "react";

type Props = {
    className?: string;
    reward: TwitchChannelReward;
    isPending: boolean;
    handleClick: (reward: TwitchChannelReward, category: ContentCategory | undefined) => void;
    isTracked: boolean;
}

export default function ChannelRewardItem({ className, reward, isPending, handleClick, isTracked }: Props) {

    const [selectedCategory, setSelectedCategory] = React.useState<ContentCategory | undefined>(reward.category);

    const buttonVariant = isTracked ? "destructive" : "secondary";

    const ButtonIcon = isTracked ? UnlinkIcon : LinkIcon;

    const onSelectCategory = (value: string) => setSelectedCategory(value === "any" ? undefined : value as ContentCategory);

    return (
        <div className={cn("flex items-center", className)}>
            <div className="flex justify-between items-center gap-2 border border-r-0 rounded-md rounded-r-none bg-primary-foreground px-2 py-1 w-full min-h-10">
                <p style={{ color: reward.backgroundColor }} className="text-sm">{reward.title}</p>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-muted-foreground">{reward.cost}</p>
                </div>
            </div>
            <Select value={selectedCategory} onValueChange={onSelectCategory} disabled={isPending}>
                <SelectTrigger className={cn("rounded-none w-1/2 flex-0 h-full")} disabled={isPending}>
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {CONTENT_CATEGORIES.map(category => (
                        <SelectItem
                            key={category}
                            value={category}
                        >
                            {localizeContentCategory(category, true)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant={buttonVariant} size='icon' disabled={isPending} className="rounded-l-none flex-shrink-0 h-full min-h-10" onClick={() => handleClick(reward, selectedCategory)}>
                {isPending ? <LoadingSpinner /> : <ButtonIcon className="w-4 h-4" />}
            </Button>
        </div>
    );
}