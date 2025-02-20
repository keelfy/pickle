import { Textarea } from "@/components/ui/textarea";
import { FormControl } from "@/components/ui/form";
import { MessageCircleIcon } from "lucide-react";
import { FormLabel } from "@/components/ui/form";
import { FormItem } from "@/components/ui/form";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";

type Props<V extends FieldValues, N extends FieldPath<V>> = {
    field: ControllerRenderProps<V, N>;
}

export default function CommentFormItem<V extends FieldValues, N extends FieldPath<V>>({ field }: Props<V, N>) {
    return (
        <FormItem className="space-y-2">
            <FormLabel className="text-md font-semibold flex items-center gap-2">
                <MessageCircleIcon className="w-4 h-4" />
                Comment
            </FormLabel>
            <FormControl>
                <Textarea
                    {...field}
                    placeholder="Type your comment here."
                />
            </FormControl>
        </FormItem>
    )
}
