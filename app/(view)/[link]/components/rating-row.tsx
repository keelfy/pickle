import RatingStar from "./rating-star";

type Props = {
    value: number | undefined;
};

export default function RatingRow({ value }: Props) {
    return (
        <div className="flex items-center gap-1">
            {[...Array(10)].map((_, i) => (
                <RatingStar
                    key={i}
                    active={value !== undefined && i < value}
                    number={i + 1}
                    className="transition-all duration-300 hover:scale-110"
                />
            ))}
        </div>
    );
}
