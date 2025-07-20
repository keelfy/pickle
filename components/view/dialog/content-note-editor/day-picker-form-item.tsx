import EditableDate from "@/app/(view)/[link]/components/editable-date";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { FormControl, FormItem } from "@/components/ui/form";
import { Locale } from "react-day-picker";
import { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";

type Props<V extends FieldValues, N extends FieldPath<V>> = {
    field: ControllerRenderProps<V, N>;
    locale?: Locale;
    disabled?: boolean;
}

export default function DayPickerFormItem<V extends FieldValues, N extends FieldPath<V>>({ field, locale, disabled = false }: Props<V, N>) {
    return (
        <FormItem>
            <FormControl>
                <DateTimePicker
                    granularity="day"
                    locale={locale ?? {
                        code: navigator.language,
                    }}
                    triggerButtonProps={{
                        size: "icon",
                        variant:
                            "ghost",
                        className:
                            "w-full h-6 px-1",
                    }}
                    disabled={disabled}
                    {...field}
                >
                    <EditableDate value={field.value} disabled={disabled} />
                </DateTimePicker>
            </FormControl>
        </FormItem>
    )
}
