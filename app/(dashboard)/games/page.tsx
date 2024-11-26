import Link from "next/link";

import { ContentLayout } from "@/components/dashboard/content-layout";
import CreateGameNoteCard from "@/components/dashboard/create-game-note-card/create-game-note-card";
import { GameFeedbackCard } from "@/components/game-feedback-card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { fetchApi } from "@/utils/api/server";
import { createClient } from "@/utils/supabase/server";

const Page = async () => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const gameNotes = await fetchApi<GameNote[]>(
        `/v1/users/${user?.id}/game-notes`
    );

    return (
        <ContentLayout title="Game Notes">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboard">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Games</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <CreateGameNoteCard />
            <div className="flex flex-col gap-6">
                {gameNotes.map((note) => (
                    <GameFeedbackCard key={note.id} note={note} />
                ))}
            </div>
        </ContentLayout>
    );
};

export default Page;
