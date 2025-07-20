import { Button } from "@/components/ui/button";
import { fetchMyProfile } from "@/hooks/api-endpoints-server";
import getCurrentSession from "@/hooks/getCurrentSession";
import Link from "next/link";

export default async function LandingPage() {
    const session = await getCurrentSession();
    const profile = session?.identity?.id ? await fetchMyProfile() : undefined;

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center gap-10">
            <h1 className="text-4xl font-semibold font-mono">
                this is <span className="font-bold text-green-600">pickle</span>{" "}
                🥒
            </h1>
            <div className="flex flex-col gap-2 items-center justify-center">
                <h3 className="text-xl text-center">
                    a platform to track <span className="font-bold">games</span>{" "}
                    you've played, <span className="font-bold">movies</span>{" "}
                    you've watched, and more.
                </h3>
                <p className="text-muted-foreground">
                    or flex to your audience or friends.
                </p>
            </div>
            <Button
                className="font-mono bg-green-600 text-white hover:bg-green-700"
                size="lg"
                asChild
            >
                <Link href={profile ? `/${profile.username}` : "/sign-up"}>
                    {profile ? "my profile" : "get started"}
                </Link>
            </Button>
        </div>
    );
}
