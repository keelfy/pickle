"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";

type Props<TFieldValues extends string> = {
    value: string;
    field: UseFormRegisterReturn<TFieldValues>;
}

export default function EditableContentName<TFieldValues extends string>({ value, field }: Props<TFieldValues>) {
    const [isEditingName, setIsEditingName] = React.useState(false);

    if (!isEditingName) {
        return (
            <Button
                variant="link"
                className="p-0 text-start font-bold text-lg cursor-text w-fit"
                type="button"
                onClick={() => setIsEditingName(!isEditingName)}
            >
                {value}
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-2 mt-2">
            <Input
                {...field}
                defaultValue={value}
                onBlur={() => setIsEditingName(false)}
                className="flex-1"
            />
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
