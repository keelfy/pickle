import LanguageDropdownMenu from "@/components/language-dropdown-menu";
import ProfileAvatar from "@/components/profile-avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Card, CardDescription } from "@/components/ui/card";
import { fetchProfileByLink } from "@/hooks/api-endpoints-server";
import { getShortenedCount } from "@/lib/count-shortener";
import Link from "next/link";
import OrderForm from "./order-form";
import OrdersDisabledSection from "./orders-disabled-section";

export type Props = {
    params: Promise<{ link: string }>;
}

export default async function SuggestPage({ params }: Props) {
    const { link } = await params;

    const profile = await fetchProfileByLink(link, 'lg').catch(() => {
        return undefined;
    })

    if (!profile) {
        return (
            <div className="h-screen w-full px-4 flex items-center justify-center">
                <div className="flex flex-col gap-4 items-center">
                    <div className="text-2xl font-medium">
                        404 Profile not found
                    </div>
                    <div className="text-sm text-muted-foreground">
                        The profile you are looking for does not exist.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full">
            <div className="flex flex-col gap-4 max-w-2xl min-w-max mx-auto py-16">
                <Card className="flex items-center gap-4 p-4 max-w-2xl min-w-max shadow-lg">
                    <Link href={`/${profile.link}`} target="_blank">
                        <ProfileAvatar
                            avatarUrl={profile.avatarUrl}
                            size="lg"
                            className="h-24 w-24 hover:opacity-80 transition-opacity"
                        />
                    </Link>
                    <div className="space-y-2">
                        <div className="space-y-0">
                            <Link href={`/${profile.link}`} target="_blank" className="text-3xl font-bold cursor-pointer">
                                {profile?.username}
                            </Link>
                            <div className="flex items-center gap-2 text-sm">
                                <div>
                                    @{profile.link}
                                </div>
                                <div className="text-muted-foreground">
                                    &bull;
                                </div>
                                <div>
                                    {getShortenedCount(profile?.counts?.followers ?? 0)} followers
                                </div>
                            </div>
                        </div>
                        <CardDescription>
                            You can suggest any game, movie, series, anime or just a video!
                        </CardDescription>
                    </div>
                </Card>
                <Card className="flex-1 flex flex-col items-center gap-4 max-w-2xl shadow-lg">
                    <div className="relative">
                        <OrderForm profile={profile} className="p-6 max-w-2xl" />
                        {!profile.suggestionPreferences.enabled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                <OrdersDisabledSection profile={profile} />
                            </div>
                        )}
                    </div>
                </Card>
                <div className="flex justify-between items-center gap-4">
                    <div className="flex flex-col">
                        <div className="text-xs">
                            Powered by <a href="https://pickle.gg" target="_blank" className="hover:underline decoration-muted-foreground underline-offset-2 font-bold">pickle</a>
                        </div>
                        <div className="text-[0.7rem] text-muted-foreground">
                            Egor Kuzmin&nbsp;&bull;&nbsp;Terazije 4, 11000 Belgrade, Serbia
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageDropdownMenu />
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
        </div>
    )
}
