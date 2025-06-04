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

const DynamicIntegrationsSettingsTab = dynamic(
    () => import("./integrations-tab/integrations-settings-tab"),
    { loading: () => <LoadingSpinner /> }
);

const DynamicModerationSettingsTab = dynamic(
    () => import("./moderation-tab/moderation-settings-tab"),
    { loading: () => <LoadingSpinner /> }
);

const DynamicSuggestionsSettingsTab = dynamic(
    () => import("./suggestions-tab/suggestions-settings-tab"),
    { loading: () => <LoadingSpinner /> }
);

export type ProfileSettingsDialogTab =
    | "general"
    | "security"
    | "notifications"
    | "moderation"
    | "integrations"
    | "suggestions"
    | "payments";

type Props = { tab: ProfileSettingsDialogTab };

export default function TabContent({ tab }: Props) {
    const profile = useAuthStore((state) => state.profile);
    if (!profile) return null;

    switch (tab) {
        case "general":
            return <DynamicGeneralSettingsTab />;
        case "security":
            return <DynamicSecuritySettingsTab />;
        case "integrations":
            return <DynamicIntegrationsSettingsTab />;
        case "moderation":
            return <DynamicModerationSettingsTab />;
        case "notifications":
            return <div />;
        case "suggestions":
            return <DynamicSuggestionsSettingsTab />;
        case "payments":
            return <div />;
    }

    return <div />;
}
