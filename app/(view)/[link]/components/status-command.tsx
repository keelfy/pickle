import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react";

type Status = {
    label: string;
    value: string;
};

type Props = {
    statuses: Status[];
    value: string | undefined;
    onChange: (value: string) => void;
    getLabel: (status: Status) => React.ReactNode;
};

const StatusCommand = ({ statuses, value, onChange, getLabel }: Props) => {
    return (
        <Command>
            <CommandList>
                <CommandGroup>
                    {statuses.map((status) => (
                        <CommandItem
                            key={status.value}
                            value={status.value}
                            onSelect={onChange}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === status.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                )}
                            />
                            {getLabel(status)}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
};

export default StatusCommand;
