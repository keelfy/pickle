"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import React from "react";
import { ControllerRenderProps, FieldValues, FieldPath, UseFormRegisterReturn } from "react-hook-form";

type Props<TFieldValues extends FieldValues, N extends FieldPath<TFieldValues>> = {
    value: string;
    field: ControllerRenderProps<TFieldValues, N>;
}

export default function EditableContentName<TFieldValues extends FieldValues, N extends FieldPath<TFieldValues>>({ value, field }: Props<TFieldValues, N>) {
    const [isEditingName, setIsEditingName] = React.useState(false);

    if (!isEditingName) {
        return (
            <Button
                variant="link"
                className="p-0 text-start font-bold text-lg cursor-text whitespace-normal w-fit h-fit"
                type="button"
                onClick={() => setIsEditingName(!isEditingName)}
            >
                {value.length > 0 ? value : "Untitled"}
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <Input className="flex-1" {...field} />
            <Button
                size="icon"
                variant="secondary"
                type="button"
                className="text-green-500"
                onClick={() => setIsEditingName(false)}
            >
                <Check />
            </Button>
        </div>
    )
}
