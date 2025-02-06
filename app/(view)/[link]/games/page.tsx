import LoadingSpinner from "@/components/ui/loading-spinner";
import { Suspense } from "react";
import GameNoteDialog from "../../../../components/view/dialog/game-note/game-note-dialog";
import GameNoteGrid from "./game-note-grid";

export default function Page() {
    return (
        <>
            <GameNoteDialog />
            <Suspense fallback={<LoadingSpinner />}>
                <GameNoteGrid className="w-full" />
            </Suspense>
        </>
    );
}
