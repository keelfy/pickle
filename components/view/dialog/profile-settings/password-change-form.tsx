"use client";

import { changePasswordAction } from "@/app/actions";
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

const formSchema = z
    .object({
        currentPassword: z.string().min(1, {
            message: "Current password is required",
        }),
        newPassword: z
            .string()
            .min(1, {
                message: "New password is required",
            })
            .min(6, {
                message: "New password must be at least 6 characters",
            }),
        confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
    });

const defaultFormValues: z.infer<typeof formSchema> = {
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
};

type Props = {
    className?: string;
};

export default function PasswordChangeForm({ className }: Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormValues,
    });

    const [isLoading, startTransition] = React.useTransition();

    const [error, setError] = React.useState<string>();

    const handleSubmit = form.handleSubmit((values) =>
        startTransition(() =>
            changePasswordAction(values).then((res) => {
                if (res !== undefined && typeof res === "string") {
                    setError(res);
                    return;
                }

                setError(undefined);
                form.reset(defaultFormValues);
                toast({
                    title: "Password changed",
                    description: "Your password has been successfully changed",
                });
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
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current password</FormLabel>
                            <FormControl>
                                <PasswordInput
                                    autoComplete="current-password"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex items-start space-x-2 w-full justify-between">
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem className="w-1/2">
                                <FormLabel>New password</FormLabel>
                                <FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmNewPassword"
                        render={({ field }) => (
                            <FormItem className="w-1/2">
                                <FormLabel>Confirm new password</FormLabel>
                                <FormControl>
                                    <PasswordInput
                                        autoComplete="confirm-new-password"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-1 pt-2 w-full">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? <LoadingSpinner /> : <Check />}
                        Confirm password change
                    </Button>
                    {error && (
                        <div className="text-[0.8rem] font-medium text-destructive">
                            {error}
                        </div>
                    )}
                </div>
            </form>
        </Form>
    );
}
