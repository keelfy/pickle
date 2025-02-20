import GameNoteGrid from "./game-note-grid";

export default function GameNoteGridPage() {
    return (
        <div className="flex flex-col gap-8 justify-center md:justify-start md:items-start">
            <GameNoteGrid />
        </div>
    );
}
