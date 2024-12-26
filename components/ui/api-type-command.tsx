"use client";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ApiType, orderCategories } from "@/utils/api/constants";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react";

export type ApiTypeCommandProps = {
    entries: ApiType[];
    value: number;
    onSelect: (value: number) => void;
    getLabel: (category: ApiType) => any;
    placeholder?: string;
    nothingFound?: string;
};

const ApiTypeCommand = ({
    entries,
    value,
    onSelect,
    getLabel,
    placeholder,
    nothingFound = "Nothing found",
}: ApiTypeCommandProps) => {
    return (
        <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
                <CommandEmpty>{nothingFound}</CommandEmpty>
                <CommandGroup>
                    {entries.map((entry) => (
                        <CommandItem
                            key={entry.idx}
                            value={entry.idx.toString()}
                            onSelect={(selected) =>
                                onSelect(parseInt(selected))
                            }
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === entry.idx
                                        ? "opacity-100"
                                        : "opacity-0"
                                )}
                            />
                            {getLabel(entry)}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
};

export default ApiTypeCommand;
