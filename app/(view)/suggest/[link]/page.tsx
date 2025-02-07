import LanguageDropdownMenu from "@/components/language-dropdown-menu";
import ProfileAvatarServer from "@/components/profile-avatar-server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Card, CardDescription } from "@/components/ui/card";
import { fetchMyAvatar, fetchProfileByLink } from "@/hooks/api-endpoints-server";
import getUser from "@/hooks/getUser";
import Link from "next/link";
import OrderForm from "./order-form";

export type Props = {
    params: Promise<{ link: string }>;
}

const getFollowersCountText = (count: number) => {
    if (count === 0) return "0";
    if (count < 1000) return count;
    if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
    if (count < 1000000) return `${(count / 1000).toFixed(0)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
}

export default async function SuggestPage({ params }: Props) {
    const { link } = await params;
    const user = await getUser();
    const profile = await fetchProfileByLink(link).catch(() => {
        return undefined;
    });

    if (!profile) {
        return <div className="h-screen w-full px-4 flex items-center justify-center">
            <div className="flex flex-col gap-4 items-center">
                <div className="text-2xl font-medium">
                    404 Profile not found
                </div>
                <div className="text-sm text-muted-foreground">
                    The profile you are looking for does not exist.
                </div>
            </div>
        </div>
    }

    const myAvatarUrl = user ? await fetchMyAvatar().catch(() => undefined) : undefined;

    return (
        <div className="h-screen w-full">
            <div className="flex flex-col gap-4 max-w-2xl min-w-max mx-auto py-16">
                <Card className="flex items-center gap-4 p-4 max-w-2xl min-w-max shadow-lg">
                    <Link href={`/${profile.link}`} target="_blank">
                        <ProfileAvatarServer profile={profile} size="lg" className="h-24 w-24 hover:opacity-80 transition-opacity" />
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
                                    {getFollowersCountText(profile?.counts?.followers ?? 0)} followers
                                </div>
                            </div>
                        </div>
                        <CardDescription>
                            You can suggest any game, movie, series, anime or just a video!
                        </CardDescription>
                    </div>
                </Card>
                <Card className="flex-1 h-full flex flex-col items-center gap-4 max-w-2xl min-w-max shadow-lg">
                    <OrderForm profile={profile} myAvatarUrl={myAvatarUrl?.url} className="w-full p-6" />
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
