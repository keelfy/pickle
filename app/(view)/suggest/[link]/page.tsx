import LanguageDropdownMenu from "@/components/language-dropdown-menu";
import ProfileAvatar from "@/components/profile-avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Card, CardDescription } from "@/components/ui/card";
import { fetchProfileByLink } from "@/hooks/api-endpoints-server";
import { getShortenedCount } from "@/lib/count-shortener";
import { Metadata } from "next";
import Link from "next/link";
import OrderForm from "./order-form";
import OrdersDisabledSection from "./orders-disabled-section";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { link } = await params;

    const profile = await fetchProfileByLink(link, "lg").catch(
        (error: any) => error.message
    );

    if (!profile || typeof profile === "string") {
        return { title: "Profile not found - pickle" };
    }

    return {
        title: `Suggest for ${profile.username} - pickle`,
        description: `Suggest content for ${profile.username} on pickle.pw`,
        openGraph: {
            type: "website",
            title: `Suggest for ${profile.username} - pickle`,
            url: `https://pickle.pw/suggest/${profile.link}`,
            description: `Suggest content for ${profile.username} on pickle.pw`,
            siteName: "pickle",
            images: [{ url: profile.avatarUrl }],
        },
    };
}

export type Props = { params: Promise<{ link: string }> };

export default async function SuggestPage({ params }: Props) {
    const { link } = await params;

    const profile = await fetchProfileByLink(link, "lg").catch(() => {
        return undefined;
    });

    if (!profile || typeof profile === "string") {
        return (
            <div className="h-screen w-full px-4 flex items-center justify-center">
                <div className="flex flex-col gap-4 items-center">
                    <p className="text-xl font-medium">
                        The profile you are looking for does not exist.
                    </p>
                    <p className="text-destructive">
                        {profile ?? "Unknown error"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full">
            <div className="flex flex-col gap-4 max-w-2xl min-w-max mx-auto py-16">
                <Card className="flex items-center gap-4 p-4 max-w-2xl min-w-max shadow-lg">
                    <Link
                        href={`/${profile.username}`}
                        target="_blank"
                        legacyBehavior
                    >
                        <ProfileAvatar
                            avatarUrl={profile.avatarUrl}
                            size="lg"
                            className="h-24 w-24 hover:opacity-80 transition-opacity"
                        />
                    </Link>
                    <div className="space-y-2">
                        <div className="space-y-0">
                            <Link
                                href={`/${profile.username}`}
                                target="_blank"
                                className="text-3xl font-bold cursor-pointer"
                                legacyBehavior
                            >
                                {profile?.displayName}
                            </Link>
                            <div className="flex items-center gap-2 text-sm">
                                <div>@{profile.username}</div>
                                <div className="text-muted-foreground">
                                    &bull;
                                </div>
                                <div>
                                    {getShortenedCount(
                                        profile?.counts?.followers ?? 0
                                    )}{" "}
                                    followers
                                </div>
                            </div>
                        </div>
                        <CardDescription>
                            You can suggest any game, movie, series, anime or
                            just a video!
                        </CardDescription>
                    </div>
                </Card>
                <Card className="flex-1 flex flex-col items-center gap-4 max-w-2xl shadow-lg">
                    <div className="relative">
                        <OrderForm
                            profile={profile}
                            className="p-6 max-w-2xl"
                        />
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
                            Powered by{" "}
                            <a
                                href="https://pickle.gg"
                                target="_blank"
                                className="hover:underline decoration-muted-foreground underline-offset-2 font-bold"
                            >
                                pickle
                            </a>
                        </div>
                        <div className="text-[0.7rem] text-muted-foreground">
                            Egor Kuzmin&nbsp;&bull;&nbsp;Terazije 4, 11000
                            Belgrade, Serbia
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageDropdownMenu />
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
        </div>
    );
}
