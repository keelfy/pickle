import { Button } from "@/components/ui/button";
import { ProfileSettingsDialogTab } from "./tab-content";
import { cn } from "@/utils/cn";

type Props = {
    tab: ProfileSettingsDialogTab;
    active: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
}

export default function ProfileSettingsTabButton({ tab, icon, label, active, onClick, className }: Props) {
    return (
        <Button
            variant={active ? "default" : "ghost"}
            onClick={onClick}
            className={cn("w-full flex items-center justify-start gap-1 text-sm", className)}
        >
            {icon}
            {label}
        </Button>
    );
}