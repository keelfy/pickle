import { GameFeedbackCard } from "@/components/game-feedback-card";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/utils/api/server";
import { Clapperboard, Gamepad, Search, Tv } from "lucide-react";
import Link from "next/link";

type Props = {
    params: Promise<{
        username: string;
    }>;
};

const Page = async ({ params }: Props) => {
    const username = (await params).username;

    const notes = await fetchApi<GameNote[]>(
        `/v1/profiles/${username}/game-notes`
    );

    const pathname = "/games";

    return (
        <div className="container">
            <div className="grid grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-col max-w-300 gap-3">
                        <h2 className="mx-auto text-lg">{username}</h2>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant={
                                pathname.includes("/games")
                                    ? "secondary"
                                    : "ghost"
                            }
                            className="w-full justify-start h-10 mb-1"
                        >
                            <Link href={"/games"} className="flex gap-2">
                                <span>
                                    <Gamepad size={18} />
                                </span>
                                <p className="max-w-[200px] truncate translate-x-0 opacity-100">
                                    Games
                                </p>
                            </Link>
                        </Button>
                        <Button
                            variant={
                                pathname.includes("/movies")
                                    ? "secondary"
                                    : "ghost"
                            }
                            className="w-full justify-start h-10 mb-1"
                        >
                            <Link href={"/movies"} className="flex gap-2">
                                <span>
                                    <Clapperboard size={18} />
                                </span>
                                <p className="max-w-[200px] truncate translate-x-0 opacity-100">
                                    Movies
                                </p>
                            </Link>
                        </Button>
                        <Button
                            variant={
                                pathname.includes("/serials")
                                    ? "secondary"
                                    : "ghost"
                            }
                            className="w-full justify-start h-10 mb-1"
                        >
                            <Link href={"/serials"} className="flex gap-2">
                                <span>
                                    <Tv size={18} />
                                </span>
                                <p className="max-w-[200px] truncate translate-x-0 opacity-100">
                                    Serials and Anime
                                </p>
                            </Link>
                        </Button>
                    </CardContent>
                    <CardFooter>
                        <p>Made with Pickle.pw</p>
                    </CardFooter>
                </Card>
                <div className="flex flex-col">
                    <div className="relative mb-6">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search for a game or a comment..."
                            className="pl-8"
                        />
                    </div>
                    <div className="flex flex-col gap-6">
                        {notes.map((note) => (
                            <GameFeedbackCard key={note.id} note={note} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;
