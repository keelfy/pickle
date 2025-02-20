import RatingRowInput from "@/app/(view)/[link]/components/rating-row-input";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { HeartIcon } from "lucide-react";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";

type Props<V extends FieldValues, N extends FieldPath<V>> = {
    field: ControllerRenderProps<V, N>;
}

export default function RateFormItem<V extends FieldValues, N extends FieldPath<V>>({ field }: Props<V, N>) {
    return (
        <FormItem>
            <FormLabel className="text-md font-semibold flex items-center gap-2">
                <HeartIcon className="w-4 h-4" />
                Rate
            </FormLabel>
            <FormControl>
                <RatingRowInput value={field.value ?? 0} onChange={field.onChange} />
            </FormControl>
        </FormItem>
    )
}
