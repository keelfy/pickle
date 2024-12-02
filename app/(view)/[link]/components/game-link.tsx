import Link from "next/link";
import GameUrl from "./game-url";

type Props = {
    url?: string;
    className?: string;
};

const GameLink = ({ url, className }: Props) => (
    <Link href={url ?? "#"} target="_blank">
        <GameUrl url={url} />
    </Link>
);

export default GameLink;
