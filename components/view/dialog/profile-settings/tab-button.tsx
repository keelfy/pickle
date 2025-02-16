import { Button } from "@/components/ui/button";
import { ProfileSettingsDialogTab } from "./tab-content";
import { cn } from "@/utils/cn";

type Props = {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}

export default function ProfileSettingsTabButton({ icon, label, active, onClick, className, disabled = false }: Props) {
    return (
        <Button
            variant={active ? "default" : "ghost"}
            onClick={onClick}
            className={cn("w-full flex items-center justify-start gap-1 text-sm", className)}
            disabled={disabled}
        >
            {icon}
            {label}
        </Button>
    );
}