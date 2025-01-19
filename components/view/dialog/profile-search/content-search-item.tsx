"use client";

import { Badge } from "@/components/ui/badge";
import { CommandItem } from "@/components/ui/command";
import { useModalStore } from "@/providers/modal";
import { contentCategoryLabels } from "@/utils/api/constants";
import Link from "next/link";

type Props = {
    source: Content;
    link: string;
};

export default function ContentSearchItem({ source, link }: Props) {
    const { closeModal } = useModalStore((state) => state);

    return (
        <CommandItem asChild className="cursor-pointer">
            <div className="flex items-center justify-between w-full">
                <div className="text-md">{source.name}</div>
                <Badge>
                    {
                        contentCategoryLabels.find(
                            (cat) => cat.value === source.category
                        )?.label
                    }
                </Badge>
            </div>
        </CommandItem>
    );
}
