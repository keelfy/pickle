import { buttonVariants } from "@/components/ui/button";
import { ContentNoteStatusIcon } from "@/components/ui/content-note/content-note-status-icon";
import { FormControl, FormItem } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ContentNoteStatus } from "@/utils/api/types";
import { EditIcon } from "lucide-react";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";

type Props<S extends ContentNoteStatus, V extends FieldValues, N extends FieldPath<V>> = {
    field: ControllerRenderProps<V, N>;
    options: {
        value: S;
        label: string;
    }[];
}

export default function StatusSelectFormItem<S extends ContentNoteStatus, V extends FieldValues, N extends FieldPath<V>>({ field, options }: Props<S, V, N>) {
    return (
        <FormItem>
            <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                    <SelectTrigger
                        className={cn(buttonVariants({ variant: "ghost" }), "w-full h-6 justify-between border-none px-1")}
                        isArrow={false}
                    >
                        <SelectValue placeholder="Select status">
                            <div className="flex items-center gap-2">
                                <ContentNoteStatusIcon status={field.value} classname="w-4 h-4" />
                                {options.find((option) => option.value === field.value)?.label}
                            </div>
                        </SelectValue>
                        <EditIcon className="w-4 h-4" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {options.map((status) => (
                        <SelectItem key={status.value} value={status.value} indicatorPosition="right">
                            <div className="flex items-center gap-2">
                                <ContentNoteStatusIcon status={status.value} classname="w-4 h-4" />
                                {status.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormItem>
    )
}
