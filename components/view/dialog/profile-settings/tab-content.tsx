import LoadingSpinner from "@/components/ui/loading-spinner";
import { useAuthStore } from "@/providers/auth-store";
import dynamic from "next/dynamic";

const DynamicGeneralSettingsTab = dynamic(
    () => import("./general-tab/general-settings-tab"),
    { loading: () => <LoadingSpinner /> }
);

const DynamicSecuritySettingsTab = dynamic(
    () => import("./security-tab/security-settings-tab"),
    { loading: () => <LoadingSpinner /> }
);

const DynamicModerationSettingsTab = dynamic(
    () => import("./moderation-tab/moderation-settings-tab"),
    { loading: () => <LoadingSpinner /> }
);

function ConnectionsTab() {
    return <div>Connections tab</div>;
}

function NotificationsTab() {
    return <div>Notifications tab</div>;
}

export type ProfileSettingsDialogTab =
    | "general"
    | "security"
    | "notifications"
    | "moderation"
    | "connections";

type Props = {
    tab: ProfileSettingsDialogTab;
}

export default function TabContent({ tab }: Props) {
    const profile = useAuthStore((state) => state.profile);
    if (!profile) return null;

    switch (tab) {
        case "general":
            return <DynamicGeneralSettingsTab />;
        case "security":
            return <DynamicSecuritySettingsTab />;
        case "connections":
            return <ConnectionsTab />;
        case "moderation":
            return <DynamicModerationSettingsTab />;
        case "notifications":
            return <NotificationsTab />;
    }

    return <div>Tab content</div>;
}
