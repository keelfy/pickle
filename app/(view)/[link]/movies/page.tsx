import MovieNoteGrid from "./movie-note-grid";

export default function MoviesPage() {
    return (
        <div className="flex flex-col gap-8 justify-center md:justify-start md:items-start">
            <MovieNoteGrid />
        </div>
    );
}
