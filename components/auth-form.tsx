"use client";

import { toast } from "@/hooks/use-toast";
import ory from "@/lib/ory";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { SiDiscord, SiDiscordHex, SiGoogle, SiGoogleHex, SiTwitch, SiTwitchHex } from "@icons-pack/react-simple-icons";
import { ErrorBrowserLocationChangeRequired, ErrorGeneric, isResponseError, isUiNodeInputAttributes, LoginFlow, RegistrationFlow, ResponseError, UiNode, UiNodeInputAttributes } from "@ory/client-fetch";
import Link from "next/link";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import React from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormRootError } from "./ui/form";
import YandexIcon from "./ui/icons/yandex-icon";
import { Input } from "./ui/input";
import LoadingSpinner from "./ui/loading-spinner";

type Props = {
    className?: string;
    flow: LoginFlow | RegistrationFlow | undefined;
    flowType: "login" | "registration" | "refresh";
    isFlowLoading?: boolean;
};

const formSchema = z
    .object({
        flowType: z.enum(["login", "registration", "refresh"]),
        csrfToken: z.string().optional().default(""),
        email: z.string().email({ message: "Invalid email address" }),
        password: z
            .string()
            .min(6, { message: "Password must be at least 6 characters" }),
        repeatPassword: z.string(),
    })
    .refine(
        (data) => data.flowType !== "registration" || data.password === data.repeatPassword,
        { message: "Passwords don't match", path: ["repeatPassword"] }
    );

const getOryUiNodeByGroupAndName = (nodes: UiNode[], group: string, name: string) => {
    return nodes.find(node => node.group === group && (node.attributes as UiNodeInputAttributes).name === name);
}

const AuthForm = ({ flowType, className, flow, isFlowLoading = false }: Props) => {
    const [goto] = useQueryState('goto', parseAsString.withDefault(""));

    const [refresh] = useQueryState('refresh', parseAsBoolean.withDefault(false));
    const [flowResult, setFlowResult] = React.useState<LoginFlow>();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            csrfToken: "",
            flowType,
            email: "",
            password: "",
            repeatPassword: "",
        },
    });

    const [isLoading, startTransition] = React.useTransition();

    React.useEffect(() => {
        if (!flow) return;
        form.reset({
            csrfToken: (getOryUiNodeByGroupAndName(flow.ui.nodes, 'default', 'csrf_token')?.attributes as UiNodeInputAttributes)?.value ?? "",
            flowType,
            email: (getOryUiNodeByGroupAndName(flow.ui.nodes, 'default', 'identifier')?.attributes as UiNodeInputAttributes)?.value ?? "",
            password: "",
            repeatPassword: "",
        });
    }, [flow?.id]);

    const onLoginFlowSubmit = (data: z.infer<typeof formSchema>) => startTransition(async () => {
        if (!flow) return;
        try {
            const res = await ory.updateLoginFlow({
                flow: flow.id,
                updateLoginFlowBody: {
                    method: 'password',
                    csrf_token: data.csrfToken,
                    identifier: data.email,
                    password: data.password,
                },
            });
            setFlowResult(undefined);
            if (res.continue_with && res.continue_with[0].action === "redirect_browser_to") {
                window.location.href = res.continue_with[0].redirect_browser_to;
            }
        } catch (error: any) {
            if (error instanceof ResponseError) {
                if (error.response.status === 400) {
                    const res = await error.response.json() as LoginFlow;
                    setFlowResult(res);
                } else if (error.response.status === 422) {
                    const res = await error.response.json() as ErrorBrowserLocationChangeRequired;
                    if (res.redirect_browser_to) {
                        window.location.href = res.redirect_browser_to;
                    }
                } else {
                    const res = await error.response.json() as ErrorGeneric;
                    toast({
                        title: "Failed to login",
                        description: res.error.message,
                        variant: "destructive",
                    })
                }
            } else {
                toast({
                    title: "Failed to login",
                    description: "Unknown error. Please try again.",
                    variant: "destructive",
                })
            }
        }
    });

    const onRegistrationFlowSubmit = (data: z.infer<typeof formSchema>) => startTransition(async () => {
        if (!flow) return;
        try {
            const res = await ory.updateRegistrationFlow({
                flow: flow.id,
                updateRegistrationFlowBody: {
                    method: 'password',
                    csrf_token: data.csrfToken,
                    password: data.password,
                    traits: {
                        email: data.email,
                    }
                },
            });
            setFlowResult(undefined);
            if (res.continue_with && res.continue_with[0].action === "redirect_browser_to") {
                window.location.href = res.continue_with[0].redirect_browser_to;
            }
        } catch (error: any) {
            if (isResponseError(error)) {
                if (error.response.status === 400) {
                    const res = await error.response.json() as LoginFlow;
                    setFlowResult(res);
                } else if (error.response.status === 422) {
                    const res = await error.response.json() as ErrorBrowserLocationChangeRequired;
                    if (res.redirect_browser_to) {
                        window.location.href = res.redirect_browser_to;
                    }
                } else {
                    const res = await error.response.json() as ErrorGeneric;
                    toast({
                        title: "Failed to register",
                        description: res.error.message,
                        variant: "destructive",
                    })
                }
            } else {
                toast({
                    title: "Failed to register",
                    description: "Unknown error. Please try again.",
                    variant: "destructive",
                })
            }
        }
    });

    const onSubmit = flowType === 'registration' ? onRegistrationFlowSubmit : onLoginFlowSubmit;

    const onSubmitError = (errors: FieldErrors<z.infer<typeof formSchema>>) => {
        toast({
            title: "Failed to submit the form",
            description: Object.values(errors).map(error => error.message).join(", ") ?? "Unknown error. Please try again.",
            variant: "destructive",
        })
    }

    React.useEffect(() => {
        const msg = flowResult?.ui?.messages?.find(message => message.type === "error")?.text;
        if (msg) {
            form.setError('root', {
                message: msg,
            })
        } else {
            form.clearErrors('root');
        }
    }, [flowResult?.ui?.messages]);

    const ProviderIcon = ({ name }: { name: string, className?: string }) => {
        if (name.toLowerCase().includes("google")) {
            return <SiGoogle color={SiGoogleHex} className={className} />;
        } else if (name.toLowerCase().includes("twitch")) {
            return <SiTwitch color={SiTwitchHex} className={className} />;
        } else if (name.toLowerCase().includes("discord")) {
            return <SiDiscord color={SiDiscordHex} className={className} />;
        } else if (name.toLowerCase().includes("yandex")) {
            return <YandexIcon className={className} />;
        }
        return null;
    }

    const filterNodes = (nodes: UiNode[], groups: string[] = []) => {
        return nodes.filter(node => groups.includes(node.group ?? ""));
    }

    const mapUiOidcNode = (node: UiNode, key: number) => {
        if (!isUiNodeInputAttributes(node.attributes)) return null;

        const attrs = node.attributes as UiNodeInputAttributes;
        const nodeType = attrs.type;
        const provider = (node.meta.label?.context as any)?.provider;

        // skip extended providers (e.g. twitch-extended)
        if (attrs.value?.toLowerCase().includes("extended")) {
            return null;
        }

        switch (nodeType) {
            case "button":
            case "submit":
                return (
                    <Button
                        variant="outline"
                        className="w-full"
                        key={key}
                        type={attrs.type as "submit" | "button" | "reset" | undefined}
                        name={attrs.name}
                        value={attrs.value}
                    >
                        <div className="flex gap-2 items-center px-2">
                            <ProviderIcon name={provider} />
                            {provider}
                        </div>
                    </Button>
                )
        }
    }

    return (
        <div
            className={cn(className, "max-w-sm")}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {flowType === "registration" ? "Registration with" : (flowType === "refresh" ? "Prove your identity with" : "Login with")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {flow ? (
                        <form action={flow.ui.action} method={flow.ui.method} className="grid grid-cols-2 gap-2">
                            {filterNodes(flow.ui.nodes, ["oidc"]).reverse().map((node, id) => mapUiOidcNode(node, id))}
                        </form>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Button key={index} variant="outline" className="animate-pulse" />
                            ))}
                        </div>
                    )}
                    <p className="text-center">or using password</p>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit, onSubmitError)}
                            className="grid gap-4"
                        >
                            <FormField
                                control={form.control}
                                name="csrfToken"
                                render={({ field }) => (
                                    <Input type="hidden" {...field} />
                                )}
                            />

                            {!refresh && <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="email">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                required
                                                placeholder="mail@example.com"
                                                type="email"
                                                autoComplete="email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel
                                            htmlFor="password"
                                            className="flex justify-between items-center"
                                        >
                                            Password
                                            {flowType === "login" && (
                                                <Link
                                                    href="/forgot-password"
                                                    className="ml-auto inline-block text-sm underline"
                                                >
                                                    Forgot your password?
                                                </Link>
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                required
                                                placeholder="*****"
                                                type="password"
                                                autoComplete={
                                                    flowType === "registration"
                                                        ? "new-password"
                                                        : "current-password"
                                                }
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {flowType === "registration" && (
                                <FormField
                                    control={form.control}
                                    name="repeatPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="password">
                                                Repeat password
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    required
                                                    placeholder="*****"
                                                    type="password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <div className="grid gap-2">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || isFlowLoading}
                                >
                                    {isLoading || isFlowLoading && <LoadingSpinner />}
                                    {flowType === "registration" ? "Register" : (flowType === "refresh" ? "Confirm" : "Login")}
                                </Button>
                                {form.formState.errors.root && <FormRootError />}
                            </div>
                        </form>
                    </Form>
                    {!refresh && (
                        <div className="text-center text-sm">
                            {flowType === "registration"
                                ? "Already have an account?"
                                : "Don't have an account?"}
                            &nbsp;
                            <Link
                                href={{
                                    pathname: flowType === "registration"
                                        ? `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser`
                                        : `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/registration/browser`,
                                    query: {
                                        return_to: flow?.return_to ?? goto,
                                    },
                                }}
                                className="underline"
                            >
                                {flowType === "registration" ? "Sign in" : "Sign up"}
                            </Link>
                        </div>
                    )}
                    {/* <AuthFormMessage message={message} /> */}
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthForm;
