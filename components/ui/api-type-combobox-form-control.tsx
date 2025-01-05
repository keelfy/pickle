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

type Props = {
    entries: ApiType[];
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    nothingFound?: string;
    getSelectedLabel?: (value: number) => string;
    getEntryLabel?: (entry: ApiType) => any;
};

export default function ApiTypeComboboxFormControl({
    entries,
    value,
    onChange,
    placeholder = "",
    nothingFound,
    getSelectedLabel = (value) =>
        entries.find((entry) => entry.idx === value)?.label || placeholder,
    getEntryLabel = (entry) => (
        <PopoverClose className="w-full text-start">{entry.label}</PopoverClose>
    ),
}: Props) {
    return (
        <Popover modal>
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
