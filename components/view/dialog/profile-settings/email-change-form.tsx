"use client";

import { changeEmailAction, changePasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    email: z.string().email({
        message: "Invalid email address",
    }),
});

const defaultFormValues: z.infer<typeof formSchema> = {
    email: "",
};

type Props = {
    className?: string;
};

export default function EmailChangeForm({ className }: Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormValues,
    });

    const [isLoading, startTransition] = React.useTransition();

    const [success, setSuccess] = React.useState<string>();

    const handleSubmit = form.handleSubmit((values) =>
        startTransition(() =>
            changeEmailAction(values.email).then((res) => {
                if (res !== undefined && typeof res === "string") {
                    form.setError("email", {
                        message: res,
                    });
                    setSuccess(undefined);
                    return;
                }

                form.clearErrors();
                form.reset(defaultFormValues);
                setSuccess(
                    "Now you have to confirm email change both in your old and new email inbox."
                );
            })
        )
    );

    return (
        <Form {...form}>
            <form
                className={cn("grid space-y-2", className)}
                onSubmit={handleSubmit}
            >
                <div className="hidden">
                    <Input type="email" autoComplete="username" />
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Email</FormLabel>
                            <FormControl>
                                <Input
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-1 pt-2 w-full">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? <LoadingSpinner /> : <Check />}
                        Request email change
                    </Button>
                    {success && (
                        <div className="text-[0.8rem] font-medium">
                            {success}
                        </div>
                    )}
                </div>
            </form>
        </Form>
    );
}
