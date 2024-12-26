"use client";

import {
    signInAction,
    signInWithProviderAction,
    signUpAction,
} from "@/app/actions";
import { cn } from "@/utils/cn";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    SiGoogle,
    SiGoogleHex,
    SiTwitch,
    SiTwitchHex,
} from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthFormMessage, Message } from "./auth-form-message";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import LoadingSpinner from "./ui/loading-spinner";

type Props = {
    message: Message;
    registration: boolean;
    className?: string;
};

const formSchema = z
    .object({
        registration: z.boolean(),
        email: z.string().email({ message: "Invalid email address" }),
        password: z.string().min(8, {
            message: "Password must be at least 8 characters",
        }),
        repeatPassword: z.string(),
    })
    .refine((data) => !data.registration || data.password === data.repeatPassword, {
        message: "Passwords don't match",
        path: ["repeatPassword"],
    });

const AuthForm = ({ message, registration, className }: Props) => {
    const searchParams = useSearchParams();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            registration,
            email: "",
            password: "",
            repeatPassword: "",
        },
    });

    const [isLoading, startTransition] = React.useTransition();

    React.useEffect(() => {
        form.setValue("registration", registration);
    }, [registration])

    const getGoTo = () => {
        return searchParams.has("goto")
            ? decodeURI(searchParams.get("goto") as string)
            : undefined;
    };

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        const goto = getGoTo();

        startTransition(async () => {
            if (registration) {
                signUpAction(data.email, data.password, goto);
            } else {
                signInAction(data.email, data.password, goto);
            }
        });
    };

    const continueWithGoogle = () => {
        const goto = getGoTo();
        startTransition(() => signInWithProviderAction("google", goto));
    };

    const continueWithTwitch = () => {
        const goto = getGoTo();
        startTransition(() => signInWithProviderAction("twitch", goto));
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(className, "max-w-sm")}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            {registration ? "Registration" : "Login"}&nbsp;with
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                type="button"
                                onClick={continueWithGoogle}
                            >
                                <div className="flex gap-1 items-center">
                                    <SiGoogle
                                        color={SiGoogleHex}
                                        className="ml-2"
                                    />
                                    Google
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                type="button"
                                onClick={continueWithTwitch}
                            >
                                <div className="flex gap-1 items-center">
                                    <SiTwitch color={SiTwitchHex} />
                                    Twitch
                                </div>
                            </Button>
                        </div>
                        <p className="text-center">or using email</p>
                        <div className="grid gap-4">
                            <FormField
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
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                            {!registration && (
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
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {registration && (
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
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading && <LoadingSpinner />}
                                {registration ? "Register" : "Login"}
                            </Button>
                        </div>
                        <div className="text-center text-sm">
                            {registration
                                ? "Already have an account?"
                                : "Don't have an account?"}
                            &nbsp;
                            <Link
                                href={registration ? "/sign-in" : "/sign-up"}
                                className="underline"
                            >
                                {registration ? "Sign in" : "Sign up"}
                            </Link>
                        </div>
                        <AuthFormMessage message={message} />
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
};
export default AuthForm;
