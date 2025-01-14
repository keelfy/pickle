import ApiTypeCommand from "@/components/ui/api-type-command";
import { Button } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ApiType } from "@/utils/api/constants";
import { PopoverClose } from "@radix-ui/react-popover";
import { ChevronsUpDown } from "lucide-react";

type Props<T extends string> = {
    entries: ApiType<T>[];
    value: T;
    onChange: (value: T) => void;
    placeholder?: string;
    nothingFound?: string;
    getSelectedLabel?: (value: T) => string;
    getEntryLabel?: (entry: ApiType<T>) => any;
};

export default function ApiTypeComboboxFormControl<T extends string>({
    entries,
    value,
    onChange,
    placeholder = "",
    nothingFound,
    getSelectedLabel = (value) =>
        entries.find((entry) => entry.value === value)?.label || placeholder,
    getEntryLabel = (entry) => (
        <PopoverClose className="w-full text-start">{entry.label}</PopoverClose>
    ),
}: Props<T>) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        className="w-[200px] justify-between"
                    >
                        {getSelectedLabel(value)}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <ApiTypeCommand
                    entries={entries}
                    placeholder={placeholder}
                    nothingFound={nothingFound}
                    value={value}
                    onSelect={onChange}
                    getLabel={getEntryLabel}
                />
            </PopoverContent>
        </Popover>
    );
}
