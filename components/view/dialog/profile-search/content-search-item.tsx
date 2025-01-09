"use client";

import { Badge } from "@/components/ui/badge";
import { CommandItem } from "@/components/ui/command";
import { useModalStore } from "@/providers/modal";
import { contentCategories } from "@/utils/api/constants";
import Link from "next/link";

type Props = {
    source: Content;
    link: string;
};

export default function ContentSearchItem({ source, link }: Props) {
    const { closeModal } = useModalStore((state) => state);

    return (
        <Link href={`/${link}/games`} onClick={closeModal}>
            <CommandItem asChild className="cursor-pointer">
                <div className="flex items-center justify-between w-full">
                    <div className="text-md">{source.name}</div>
                    <Badge>
                        {
                            contentCategories.find(
                                (cat) => cat.idx === source.category
                            )?.label
                        }
                    </Badge>
                </div>
            </CommandItem>
        </Link>
    );
}
