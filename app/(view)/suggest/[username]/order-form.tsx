'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import ContentCategoryIcon from '@/components/ui/content-category-icon'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { suggestContent } from '@/hooks/api-endpoints-client'
import { toastError } from '@/lib/toasts'
import { localizeContentCategory } from '@/lib/localize-types'
import {
  ContentCategory,
  GLOBALLY_DISABLED_CONTENT_CATEGORIES,
  VISIBLE_CONTENT_CATEGORIES,
} from '@/lib/model/content'
import { Profile } from '@/lib/model/user'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/providers/auth-store'
import { SuggestContentReq } from '@/utils/api/request'
import { zodResolver } from '@hookform/resolvers/zod'
import { DollarSignIcon, SendIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import AuthSuggestSection from './auth-section'
import OrderSenderName from './order-sender-name'

type Props = {
  profile: Profile
  className?: string
}

const orderFormSchema = z
  .object({
    type: z.custom<ContentCategory>(),
    username: z.string(),
    isAnonymously: z.boolean(),
    contentId: z.uuid().optional(),
    paid: z.boolean(),
    amount: z.number().min(0, { message: 'Amount can not be negative' }),
    currency: z.enum(['USD', 'EUR', 'RUB', 'GBP', 'BRL', 'TRY', 'PLN'], {
      message: 'Currency is required',
    }),
    message: z
      .string()
      .min(1, { message: 'Message is required' })
      .max(150, { message: 'Message must be less than 150 characters' }),
  })
  .refine(
    (data) => data.isAnonymously || (data.username && data.username.length > 0),
    {
      message: 'Username is required',
      path: ['username'],
    },
  )

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
  GBP: '£',
  BRL: 'R$',
  TRY: '₺',
  PLN: 'zł',
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  RUB: 'Russian Ruble',
  GBP: 'British Pound',
  BRL: 'Brazilian Real',
  TRY: 'Turkish Lira',
  PLN: 'Polish Zloty',
}

export default function OrderForm({ profile, className }: Props) {
  const user = useAuthStore((state) => state.user)
  const [isLoading, startTransition] = React.useTransition()
  const router = useRouter()

  const [selectedCurrency, setSelectedCurrency] = React.useState('USD')

  const defaultValues: z.infer<typeof orderFormSchema> = {
    type: profile.suggestionPreferences?.categories[0] as ContentCategory,
    message: '',
    paid: true,
    currency: 'USD' as const,
    amount: 1,
    isAnonymously:
      profile.suggestionPreferences?.allowedAnonymously ?? user === undefined,
    username: user?.displayName ?? '',
  }

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  })

  const onSubmit = (data: z.infer<typeof orderFormSchema>) => {
    if (!profile) return
    startTransition(async () => {
      try {
        const req: SuggestContentReq = {
          ordererUsername: data.username ?? '',
          isAnonymously: data.isAnonymously,
          category: data.type,
          contentId: data.contentId,
          message: data.message,
        }
        await suggestContent(profile, req)
        router.push(`/${profile.username}`)
      } catch (error) {
        toastError('Failed to create order', error)
      }
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('flex h-full w-full flex-col gap-8', className)}
      >
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="flex w-full items-start justify-between gap-4">
                <div className="flex w-full flex-col">
                  <FormControl>
                    <OrderSenderName
                      avatarUrl={user?.avatarUrl}
                      username={field.value}
                      allowedAnonymously={
                        profile.suggestionPreferences?.allowedAnonymously ??
                        false
                      }
                      isAnonymously={form.watch('isAnonymously')}
                      onUsernameChange={field.onChange}
                      onAnonymouslyChange={(value) =>
                        form.setValue(
                          'isAnonymously',
                          (profile.suggestionPreferences?.allowedAnonymously ??
                            false)
                            ? value
                            : false,
                        )
                      }
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
                        {VISIBLE_CONTENT_CATEGORIES.map((value) => (
                          <TabsTrigger
                            key={value}
                            value={value}
                            disabled={
                              !profile.suggestionPreferences?.categories.includes(
                                value,
                              ) ||
                              GLOBALLY_DISABLED_CONTENT_CATEGORIES.includes(
                                value,
                              )
                            }
                          >
                            <ContentCategoryIcon
                              category={value}
                              className="mr-2 size-4"
                            />
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
                        placeholder="Enter comment with your suggestion. For example, maybe you want to suggest a game with a mod or specific season/episode of a series?"
                        {...field}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                        {form.watch('message').length} / 150
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {profile.suggestionPreferences?.allowedFree && (
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
                    <FormLabel>I would like to make a donation</FormLabel>
                    <FormDescription className="flex items-start gap-0.5">
                      <DollarSignIcon className="h-3 w-3 text-yellow-600" />
                      <span>
                        Donations are highly appreciated and will motivate{' '}
                        <span className="font-semibold">
                          {profile.username}
                        </span>{' '}
                        to consider your suggestion sooner.
                      </span>
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}
          <Collapsible open={form.watch('paid')}>
            <CollapsibleContent>
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => {
                  const isPaid = form.watch('paid')
                  return (
                    <FormItem>
                      <FormLabel
                        className={cn('transition-colors duration-200', {
                          'text-muted-foreground': !isPaid,
                        })}
                      >
                        How much are you willing to donate?
                      </FormLabel>
                      <div className="flex">
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field: currencyField }) => (
                            <Select
                              onValueChange={(value) => {
                                currencyField.onChange(value)
                                setSelectedCurrency(value)
                              }}
                              defaultValue={currencyField.value}
                            >
                              <SelectTrigger
                                className="w-20 rounded-r-none border-r-0"
                                disabled={!isPaid}
                              >
                                {currencyField.value.toUpperCase()}
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(CURRENCY_SYMBOLS).map(
                                  ([key, symbol]) => (
                                    <SelectItem key={key} value={key}>
                                      {CURRENCY_NAMES[key]} &mdash;{' '}
                                      <span className="font-bold">
                                        {symbol}
                                      </span>{' '}
                                      ({key.toUpperCase()})
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FormControl>
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              className="rounded-l-none font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              {...field}
                              disabled={!isPaid}
                              min={1}
                              onChange={(e) => {
                                try {
                                  field.onChange(Number(e.target.value))
                                } catch (error) {
                                  field.onChange(0)
                                }
                              }}
                            />
                            <div className="text-muted-foregroundO absolute inset-y-0 right-2 flex items-center">
                              {[1, 3, 5, 10].map((amount) => (
                                <Button
                                  key={amount}
                                  type="button"
                                  variant="ghost"
                                  className="underline decoration-muted-foreground decoration-dashed underline-offset-4"
                                  size="sm"
                                  onClick={() =>
                                    form.setValue('amount', amount)
                                  }
                                  disabled={!isPaid}
                                >
                                  {CURRENCY_SYMBOLS[selectedCurrency]}
                                  {amount}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                      </div>
                      <FormDescription className="flex w-full items-center justify-between">
                        <span>
                          All the money will be sent to{' '}
                          <span className="font-semibold">
                            {profile.username}
                          </span>
                          .
                        </span>
                        <span>
                          Minimum amount is 1
                          {CURRENCY_SYMBOLS[selectedCurrency]}
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
          <Button type="submit" size="lg" disabled={isLoading}>
            <div className="flex items-center justify-center gap-2">
              {isLoading ? <LoadingSpinner /> : <SendIcon />}
              Suggest content
            </div>
          </Button>
          <p className="text-xs text-muted-foreground">
            By clicking the button above, you accept our{' '}
            <Link
              href="/terms"
              className="underline decoration-muted-foreground underline-offset-2"
            >
              terms of service
            </Link>
            .
          </p>
        </div>
      </form>
    </Form>
  )
}
