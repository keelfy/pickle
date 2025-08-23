'use client'

import { Button } from '@/components/ui/button'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { toast } from '@/hooks/use-toast'
import { ContentCategory, ContentCategoryEnum } from '@/lib/model/content'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { contentCategoryLabels } from '@/utils/api/constants'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Dice5, X } from 'lucide-react'
import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import ApiTypeComboboxFormControl from '../../../ui/api-type-combobox-form-control'

// request.CreateOrderReq
const formSchema = z.object({
  receiverLink: z.string(),
  paymentType: z.number(),
  amount: z.number(),
  ordererUsername: z.string(),
  category: z.custom<ContentCategory>(),
  message: z.string(),
})

export default function CreateOrderDialogContent() {
  const { closeModal } = useModalStore((state) => state)
  const profile = useProfileStore((state) => state.profile)
  const [isLoading, startTransition] = useTransition()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receiverLink: profile?.username ?? '',
      paymentType: 0,
      amount: 0,
      ordererUsername: '',
      category: ContentCategoryEnum.Games,
      message: '',
    },
  })

  useEffect(() => {
    form.reset({
      receiverLink: profile?.username ?? '',
    })
  }, [profile?.username])

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        // await createOrder(profile, data);
        closeModal()
      } catch (error: unknown) {
        toast({
          title: 'Error while creating order',
          description:
            error instanceof Error ? error.message : 'Please try again',
        })
      }
    })
  }

  const randomize = () =>
    startTransition(async () => {
      await Promise.all([
        form.setValue('amount', Math.floor(Math.random() * 10000)),
        form.setValue('paymentType', Math.floor(Math.random() * 5)),
        form.setValue(
          'category',
          contentCategoryLabels[
            Math.floor(Math.random() * contentCategoryLabels.length)
          ].value,
        ),
        fetch('https://randomuser.me/api/')
          .then((res) => res.json())
          .then((data) =>
            form.setValue('ordererUsername', data.results[0].login.username),
          ),
        fetch('https://fakerapi.it/api/v1/texts?_quantity=1')
          .then((res) => res.json())
          .then((data) => form.setValue('message', data.data[0].title)),
      ])
    })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Suggestion</DialogTitle>
        <DialogDescription>Manual order creation</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="receiverLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receiver of the Order</FormLabel>
                <FormControl>
                  <Input placeholder="Link" {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ordererUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orderer</FormLabel>
                <FormControl>
                  <Input placeholder="Username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1">
                                <FormLabel>Payment Type</FormLabel>
                                <FormControl>
                                    <ApiTypeComboboxFormControl
                                        entries={paymentTypes}
                                        value={field.value}
                                        onChange={(selectedValue) => {
                                            form.setValue(
                                                "paymentType",
                                                selectedValue
                                            );
                                            form.setFocus("paymentType");
                                        }}
                                        placeholder="Select payment type..."
                                        nothingFound="No payment types found"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    /> */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input placeholder="Amount" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel>Category</FormLabel>
                <ApiTypeComboboxFormControl
                  entries={contentCategoryLabels}
                  value={field.value}
                  onChange={(selectedValue) => {
                    form.setValue('category', selectedValue)
                    form.setFocus('category')
                  }}
                  placeholder="Select category..."
                  nothingFound="No categories found"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Input placeholder="Message" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={randomize}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner /> : <Dice5 />}
            </Button>
            <Button
              variant="secondary"
              onClick={closeModal}
              type="button"
              disabled={isLoading}
            >
              <X />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : <Check />}
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
