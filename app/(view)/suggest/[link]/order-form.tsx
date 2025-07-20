"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import ContentCategoryIcon from "@/components/ui/content-category-icon";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/hooks/api-endpoints-client";
import { toast } from "@/hooks/use-toast";
import { localizeContentCategory } from "@/lib/localize-types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/providers/auth-store";
import { contentCategoryLabels } from "@/utils/api/constants";
import { CreateOrderReq } from "@/utils/api/request";
import { CONTENT_CATEGORIES, ContentCategory, PublicProfile } from "@/utils/api/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSignIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthSuggestSection from "./auth-section";
import OrderSenderName from "./order-sender-name";

type Props = {
    profile: PublicProfile;
    className?: string;
}

const orderFormSchema = z.object({
    type: z.custom<ContentCategory>(),
    username: z.string(),
    isAnonymously: z.boolean(),
    paid: z.boolean(),
    amount: z.number(),
    currency: z.enum(["USD", "EUR", "RUB", "GBP", "BRL", "TRY", "PLN"], {
        message: "Currency is required"
    }),
    message: z.string()
        .min(1, { message: "Message is required" })
        .max(150, { message: "Message must be less than 150 characters" }),
}).refine((data) => data.paid && data.amount > 0, {
    message: "Amount is required",
    path: ["amount"]
}).refine((data) => data.isAnonymously || (data.username && data.username.length > 0), {
    message: "Username is required",
    path: ["username"]
});

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$",
    EUR: "€",
    RUB: "₽",
    GBP: "£",
    BRL: "R$",
    TRY: "₺",
    PLN: "zł"
};

const CURRENCY_NAMES: Record<string, string> = {
    USD: "US Dollar",
    EUR: "Euro",
    RUB: "Russian Ruble",
    GBP: "British Pound",
    BRL: "Brazilian Real",
    TRY: "Turkish Lira",
    PLN: "Polish Zloty"
}

export default function OrderForm({ profile, className }: Props) {
    const myProfile = useAuthStore(state => state.profile)
    const [isLoading, startTransition] = React.useTransition()
    const router = useRouter()

    const [selectedCurrency, setSelectedCurrency] = React.useState("USD");

    const defaultValues: z.infer<typeof orderFormSchema> = {
        type: profile.suggestionPreferences.categories[0],
        message: "",
        paid: true,
        currency: "USD" as const,
        amount: 1,
        isAnonymously: profile.suggestionPreferences.allowedAnonymously && myProfile === undefined,
        username: myProfile?.displayName ?? "",
    }

    const form = useForm<z.infer<typeof orderFormSchema>>({
        resolver: zodResolver(orderFormSchema),
        defaultValues,
    });

    const onSubmit = (data: z.infer<typeof orderFormSchema>) => {
        if (!profile) return;
        startTransition(async () => {
            try {
                const req: CreateOrderReq = {
                    ordererUsername: data.username ?? "",
                    isAnonymously: data.isAnonymously,
                    category: data.type,
                    message: data.message,
                }
                await createOrder(profile, req);
                router.push(`/${profile.username}`)
            } catch (error: any) {
                toast({
                    title: "Failed to create order",
                    description: error.message ?? "An error occurred while creating the order",
                    variant: "destructive"
                })
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn("flex flex-col gap-8 w-full h-full", className)}>
                <div className="grid gap-6">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem className="flex justify-between gap-4 items-start w-full">
                                <div className="flex flex-col w-full">
                                    <FormControl>
                                        <OrderSenderName
                                            avatarUrl={myProfile?.avatarUrl}
                                            username={field.value}
                                            allowedAnonymously={profile.suggestionPreferences.allowedAnonymously}
                                            isAnonymously={form.watch("isAnonymously")}
                                            onUsernameChange={field.onChange}
                                            onAnonymouslyChange={(value) => form.setValue("isAnonymously", profile.suggestionPreferences.allowedAnonymously ? value : false)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </div>
                                <AuthSuggestSection />
                            </FormItem>
                        )}
                    />
                    <div className="grid gap-2">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>What do you want to suggest?</FormLabel>
                                    <FormControl>
                                        <Tabs
                                            className="w-full"
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <TabsList className="grid grid-cols-5">
                                                {contentCategoryLabels.map(({ value }) => (
                                                    <TabsTrigger
                                                        key={value}
                                                        value={value}
                                                        disabled={!profile.suggestionPreferences.categories.includes(value as ContentCategory)}
                                                    >
                                                        <ContentCategoryIcon category={value as ContentCategory} className="w-4 h-4 mr-2" />
                                                        {localizeContentCategory(value)}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                        </Tabs>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <Textarea
                                                placeholder="Enter your message mentioning the title, release year, season, episode, etc."
                                                {...field}
                                            />
                                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                                                {form.watch("message").length} / 150
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    {profile.suggestionPreferences.allowedFree && (
                        <FormField
                            control={form.control}
                            name="paid"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            I would like to make a donation
                                        </FormLabel>
                                        <FormDescription className="flex items-start gap-0.5">
                                            <DollarSignIcon className="w-3 h-3 text-yellow-600" />
                                            <span>
                                                Donations are highly appreciated and will motivate <span className="font-semibold">{profile.displayName}</span> to consider your suggestion sooner.
                                            </span>
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    )}
                    <Collapsible open={form.watch("paid")}>
                        <CollapsibleContent>
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => {
                                    const isPaid = form.watch("paid");
                                    return (
                                        <FormItem>
                                            <FormLabel className={cn("transition-colors duration-200", { "text-muted-foreground": !isPaid })}>How much are you willing to donate?</FormLabel>
                                            <div className="flex">
                                                <FormField
                                                    control={form.control}
                                                    name="currency"
                                                    render={({ field: currencyField }) => (
                                                        <Select
                                                            onValueChange={(value) => {
                                                                currencyField.onChange(value);
                                                                setSelectedCurrency(value);
                                                            }}
                                                            defaultValue={currencyField.value}
                                                        >
                                                            <SelectTrigger className="w-20 rounded-r-none border-r-0" disabled={!isPaid}>
                                                                {currencyField.value.toUpperCase()}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(CURRENCY_SYMBOLS).map(([key, symbol]) => (
                                                                    <SelectItem key={key} value={key}>
                                                                        {CURRENCY_NAMES[key]} &mdash; <span className="font-bold">{symbol}</span> ({key.toUpperCase()})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                <FormControl>
                                                    <div className="relative flex-1">
                                                        <Input
                                                            type="number"
                                                            className="rounded-l-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            {...field}
                                                            disabled={!isPaid}
                                                            min={1}
                                                            onChange={e => {
                                                                try {
                                                                    field.onChange(Number(e.target.value))
                                                                } catch (error) {
                                                                    field.onChange(0)
                                                                }
                                                            }}
                                                        />
                                                        <div className="absolute inset-y-0 right-2 flex items-center text-muted-foregroundO">
                                                            {[1, 3, 5, 10].map((amount) => (
                                                                <Button
                                                                    key={amount}
                                                                    type="button"
                                                                    variant='ghost'
                                                                    className="underline underline-offset-4 decoration-dashed decoration-muted-foreground"
                                                                    size='sm'
                                                                    onClick={() => form.setValue("amount", amount)}
                                                                    disabled={!isPaid}
                                                                >
                                                                    {CURRENCY_SYMBOLS[selectedCurrency]}{amount}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </FormControl>
                                            </div>
                                            <FormDescription className="w-full flex items-center justify-between">
                                                <span>
                                                    All the money will be sent to <span className="font-semibold">{profile.displayName}</span>.
                                                </span>
                                                <span>
                                                    Minimum amount is 1{CURRENCY_SYMBOLS[selectedCurrency]}
                                                </span>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
                            />
                        </CollapsibleContent>
                    </Collapsible>
                </div>
                <div className="flex flex-col gap-3">
                    <Button type="submit" size='lg' disabled={isLoading}>
                        <div className="flex items-center justify-center gap-2">
                            {isLoading ? <LoadingSpinner /> : <SendIcon />}
                            Suggest content
                        </div>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        By clicking the button above, you accept our <Link href="/terms" className="underline decoration-muted-foreground underline-offset-2">terms of service</Link>.
                    </p>
                </div>
            </form>
        </Form >
    )
}
