import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ContentCategoryIcon from "@/components/ui/content-category-icon";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/providers/auth-store";
import { contentCategoryLabels } from "@/utils/api/constants";
import { CheckIcon, CircleOffIcon } from "lucide-react";

export default function SuggestionsSettingsTab() {
    const profile = useAuthStore((state) => state.profile);

    return (
        <div className="flex flex-col space-y-4 w-full">
            <div className="flex space-x-3 space-y-0 w-full">
                <Checkbox />
                <div className="space-y-1 leading-none">
                    <Label>
                        Receive suggestions
                    </Label>
                    <p className="text-muted-foreground text-xs">
                        Allow other users to suggest content to you.
                    </p>
                </div>
            </div>

            <div className="flex space-x-3 space-y-0 w-full">
                <Checkbox />
                <div className="space-y-1 leading-none">
                    <Label>
                        Allow free suggestions
                    </Label>
                    <p className="text-muted-foreground text-xs">
                        This will allow other users to suggest content to you without making a donation.
                    </p>
                </div>
            </div>

            <div className="flex space-x-3 space-y-0 w-full">
                <Checkbox />
                <div className="space-y-1 leading-none">
                    <Label>
                        Allow anonymous suggestions
                    </Label>
                    <p className="text-muted-foreground text-xs">
                        This will allow other users to suggest content to you anonymously.
                    </p>
                </div>
            </div>

            <div className="flex flex-col space-y-3 w-full">
                <div>
                    <h2 className="text-lg font-semibold">Allowed categories</h2>
                    <p className="text-muted-foreground text-xs">
                        Select the categories you want to receive suggestions for.
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-2 ml-2">
                    {contentCategoryLabels.map(category => (
                        <div key={category.value} className="flex items-center gap-2">
                            <Checkbox />
                            <ContentCategoryIcon category={category.value} className="w-4 h-4" />
                            <Label>{category.label}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-2 w-full">
                <Button type="reset" variant="outline">
                    <CircleOffIcon />
                    Reset
                </Button>
                <Button type="submit">
                    <CheckIcon />
                    Confirm
                </Button>
            </div>
        </div>
    );
}
