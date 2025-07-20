"use client";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormRootError,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "@/hooks/use-toast";
import ory from "@/lib/ory";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { isResponseError, SettingsFlow, UiNodeInputAttributes } from "@ory/client-fetch";
import { CheckIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z
    .object({
        csrfToken: z.string(),
        newPassword: z
            .string()
            .min(1, { message: "New password is required" })
            .min(6, { message: "New password must be at least 6 characters" }),
        confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
    });

const defaultFormValues: z.infer<typeof formSchema> = {
    csrfToken: "",
    newPassword: "",
    confirmNewPassword: "",
};

type Props = {
    className?: string;
    flow: SettingsFlow | undefined;
    isFlowPending: boolean;
    updateFlow: (flow: SettingsFlow) => void
};

export default function PasswordChangeForm({ className, flow, isFlowPending, updateFlow }: Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormValues,
    });

    const [isLoading, startTransition] = React.useTransition();

    const [error, setError] = React.useState<string>();
    const [isSuccess, setIsSuccess] = React.useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const returnTo = React.useMemo(() => {
        return `${pathname}?${searchParams.toString()}`;
    }, [pathname, searchParams]);

    React.useEffect(() => {
        if (flow) {
            updateFormFromSettingsFlow(flow);
        }
    }, [flow?.ui?.nodes, form])

    const updateFormFromSettingsFlow = (flow: SettingsFlow) => {
        const passwordNode = flow?.ui?.nodes?.find(node => node.group === 'password' && (node.attributes as UiNodeInputAttributes).name === 'password');
        const csrfTokenNode = flow?.ui?.nodes?.find(node => node.group === 'default' && (node.attributes as UiNodeInputAttributes).name === 'csrf_token');

        form.reset({
            csrfToken: (csrfTokenNode?.attributes as UiNodeInputAttributes)?.value as string,
            newPassword: (passwordNode?.attributes as UiNodeInputAttributes)?.value as string,
            confirmNewPassword: (passwordNode?.attributes as UiNodeInputAttributes)?.value as string,
        });

        if (flow.state === 'success') {
            setIsSuccess(true);
        } else {
            setIsSuccess(false);
        }
    }

    const updateErrors = (flow: SettingsFlow) => {
        const flowNodes = flow?.ui?.nodes?.filter(node => node.group === 'password');
        const passwordNode = flowNodes?.find(node => (node.attributes as UiNodeInputAttributes).name === 'password');

        if (passwordNode?.messages?.length && passwordNode.messages.filter(message => message.type === 'error').length > 0) {
            form.setError("newPassword", {
                message: passwordNode.messages.filter(message => message.type === 'error')[0].text,
            })
        } else {
            form.clearErrors("newPassword");
        }
    }

    const handleSubmit = form.handleSubmit((values) =>
        startTransition(async () => {
            if (!flow) return;
            try {
                const settingsFlow = await ory.updateSettingsFlow({
                    flow: flow.id,
                    updateSettingsFlowBody: {
                        method: 'password',
                        csrf_token: values.csrfToken,
                        password: values.newPassword,
                    }
                })
                updateFlow(settingsFlow);
            } catch (error) {
                if (isResponseError(error)) {
                    const res = await error.response.json();

                    if (error.response.status === 400) {
                        updateErrors(res);
                    } else if (error.response.status === 403) {
                        if (res.error.id === 'security_csrf_violation') {
                            toast({
                                title: "Failed to request email change",
                                description: "CSRF Violation. Please try again.",
                                variant: "destructive",
                            })
                        } else if (res.error.id === 'session_refresh_required') {
                            window.location.href = `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser?refresh=true&return_to=${returnTo}`;
                        }
                    }
                }
            }
        })
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
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
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
                        <FormItem>
                            <FormLabel>Repeat password</FormLabel>
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

                <div className="grid gap-1 pt-2 w-full">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? <LoadingSpinner /> : <CheckIcon />}
                        Confirm Password Change
                    </Button>
                    {form.formState.errors.root && <FormRootError />}
                    {isSuccess && (
                        <p className="text-sm text-green-500">
                            Password changed successfully.
                        </p>
                    )}
                </div>
            </form>
        </Form>
    );
}
