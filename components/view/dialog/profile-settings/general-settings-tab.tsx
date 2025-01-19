"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { fetchApi } from "@/utils/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleOff, Upload, X } from "lucide-react";
import Image from "next/image";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
    username: z.string(),
    link: z.string(),
    description: z
        .string()
        .max(500, {
            message: "Description can't be longer than 500 characters",
        })
        .optional(),
    avatarUrl: z.string(),
});

export default function GeneralSettingsTab() {
    const { profile, avatarUrl, updateProfile } = useAuthStore(
        (state) => state
    );
    const [isLoading, startTransition] = React.useTransition();
    const [isLinkValidating, setLinkValidating] = React.useState(false);

    const [isAvatarUploading, startAvatarUpload] = React.useTransition();
    const avatarInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            link: "",
            description: "",
            avatarUrl,
        },
    });

    React.useEffect(() => {
        const link = form.watch("link");
        if (link === profile?.link) {
            form.clearErrors("link");
            return;
        }

        const getData = setTimeout(async () => {
            try {
                setLinkValidating(true);
                const res = await fetchApi<LinkValidation>(
                    `/v1/profiles/validate-link?link=${form.watch("link")}`
                );
                if (res.valid) {
                    form.clearErrors("link");
                } else {
                    form.setError("link", {
                        message: res.message,
                    });
                }
            } catch (error: any) {
                form.setError("link", {
                    message: error.message,
                });
            }
            setLinkValidating(false);
        }, 300);
        return () => clearTimeout(getData);
    }, [form.watch("link")]);

    React.useEffect(() => {
        resetForm();
    }, [profile?.id]);

    const onSubmit = async (data: z.infer<typeof formSchema>) =>
        startTransition(async () => {
            try {
                const res = await fetchApi<Profile>("/v1/profiles/me", true, {
                    method: "PATCH",
                    body: JSON.stringify(data),
                });
                updateProfile(res);
                form.reset({
                    ...profile,
                    description: profile?.description ?? "",
                    avatarUrl: data.avatarUrl,
                });
            } catch (error: any) {
                toast({
                    title: "Failed to update settings",
                    description: error.message,
                });
            }
        });

    const resetForm = () => {
        form.reset({
            ...profile,
            description: profile?.description ?? "",
            avatarUrl,
        });
    };

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];

            startAvatarUpload(async () => {
                // Create FormData
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const response = await fetchApi<any>(
                        "/v1/profiles/me/avatar",
                        true,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                    if (response.previewUrl) {
                        form.setValue(
                            "avatarUrl",
                            response.previewUrl + "?ts=" + Date.now(),
                            { shouldDirty: true }
                        );
                    }
                    form.clearErrors("avatarUrl");
                } catch (error: any) {
                    console.error("Error uploading file:", error);
                    form.setError("avatarUrl", {
                        message: error.message,
                    });
                }
            });
        }
    };

    const LinkValidationStatusIcon = ({
        className,
    }: {
        className?: string;
    }) => {
        if (isLinkValidating) {
            return <LoadingSpinner className={cn("w-4 h-4", className)} />;
        }

        return !form.getFieldState("link").invalid ? (
            <Check size={16} className={cn("text-green-500", className)} />
        ) : (
            <X size={16} className={cn("text-red-500", className)} />
        );
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col justify-between h-full space-y-6 w-full"
            >
                <div className="flex flex-col space-y-6">
                    <FormField
                        control={form.control}
                        name="avatarUrl"
                        render={({ field }) => (
                            <FormItem className="flex gap-4 items-center">
                                <Avatar className="w-32 h-32">
                                    <AvatarImage src={field.value} asChild>
                                        {field.value && (
                                            <Image
                                                src={field.value}
                                                alt="Avatar"
                                                width={128}
                                                height={128}
                                                unoptimized
                                            />
                                        )}
                                    </AvatarImage>
                                    <AvatarFallback>
                                        {profile?.username?.substring(0, 1) ??
                                            "n/a"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col space-y-2">
                                    <FormMessage />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={isAvatarUploading}
                                        className="w-min"
                                        onClick={() =>
                                            avatarInputRef.current?.click()
                                        }
                                    >
                                        {isAvatarUploading ? (
                                            <LoadingSpinner />
                                        ) : (
                                            <Upload />
                                        )}
                                        Chose new avatar
                                    </Button>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        disabled={isAvatarUploading}
                                        ref={avatarInputRef}
                                        onChange={(e) =>
                                            handleFileChange(e.target.files)
                                        }
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        Max 5MB • jpg, png, gif, svg, webp or
                                        bmp
                                    </div>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Profile name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Jane Doe" {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is how your name will be displayed on
                                    your profile.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel htmlFor="link">
                                    Link to your page
                                </FormLabel>
                                <div className="flex">
                                    <div className="text-sm flex items-center justify-center px-2 border border-r-0 rounded-l-md bg-primary-foreground">
                                        pickle.pw/
                                    </div>
                                    <FormControl>
                                        <Input
                                            className="rounded-l-none"
                                            placeholder="jane-doe"
                                            {...field}
                                        />
                                    </FormControl>
                                    <LinkValidationStatusIcon className="absolute right-9 translate-y-3" />
                                </div>
                                <FormDescription>
                                    This is how others can find you on Pickle.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel htmlFor="description">
                                    Description
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="I'm a cool person."
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    A short description about yourself that will
                                    be displayed on your profile. 500 characters
                                    max.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        onClick={resetForm}
                        type="button"
                        disabled={!form.formState.isDirty}
                    >
                        <CircleOff />
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !form.formState.isDirty}
                    >
                        {isLoading ? <LoadingSpinner /> : <Check />}
                        Confirm
                    </Button>
                </div>
            </form>
        </Form>
    );
}
