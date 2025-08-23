'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { toast } from '@/hooks/use-toast'
import ory from '@/lib/ory'
import { useAuthStore } from '@/providers/auth-store'
import { cn } from '@/utils/cn'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ResponseError,
  SettingsFlow,
  UiNodeInputAttributes,
  UpdateSettingsFlowBody,
} from '@ory/client-fetch'
import { CheckIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  method: z.string(),
  csrf_token: z.string().optional(),
  traits: z.object({
    email: z.email(),
  }),
})

const defaultFormValues: z.infer<typeof formSchema> = {
  method: 'profile',
  traits: {
    email: '',
  },
}

type Props = {
  className?: string
  flow: SettingsFlow
  updateFlow: (flow: SettingsFlow) => void
}

export default function EmailChangeForm({
  className,
  flow,
  updateFlow,
}: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  })

  const { updateSession } = useAuthStore((store) => store)

  const [isLoading, startTransition] = React.useTransition()
  const [isSuccess, setIsSuccess] = React.useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    updateFormFromSettingsFlow(flow)
  }, [flow.ui?.nodes, form])

  const updateFormFromSettingsFlow = (flow: SettingsFlow) => {
    const emailNode = flow?.ui?.nodes?.find(
      (node) =>
        node.group === 'profile' &&
        (node.attributes as UiNodeInputAttributes).name === 'traits.email',
    )
    const csrfTokenNode = flow?.ui?.nodes?.find(
      (node) =>
        node.group === 'default' &&
        (node.attributes as UiNodeInputAttributes).name === 'csrf_token',
    )

    form.reset({
      ...form.getValues(),
      csrf_token: (csrfTokenNode?.attributes as UiNodeInputAttributes)
        ?.value as string,
      traits: {
        email: (emailNode?.attributes as UiNodeInputAttributes)
          ?.value as string,
      },
    })

    if (flow.state === 'success') {
      setIsSuccess(true)
    } else {
      setIsSuccess(false)
    }

    updateErrors(flow)

    if (flow.continue_with && flow.continue_with.length > 0) {
      flow.continue_with.forEach((continueWith) => {
        if (continueWith.action === 'show_verification_ui') {
          if (continueWith.flow.url) {
            window.location.href = continueWith.flow.url
          } else {
            router.push(
              `/auth/verification?flow=${continueWith.flow.id}&email=${continueWith.flow.verifiable_address}`,
            )
          }
        }
      })
    }
  }

  const updateErrors = (flow: SettingsFlow) => {
    const flowNodes = flow?.ui?.nodes?.filter(
      (node) => node.group === 'profile',
    )
    const emailNode = flowNodes?.find(
      (node) =>
        (node.attributes as UiNodeInputAttributes).name === 'traits.email',
    )

    if (
      emailNode?.messages?.length &&
      emailNode.messages.filter((message) => message.type === 'error').length >
        0
    ) {
      form.setError('traits.email', {
        message: emailNode.messages.filter(
          (message) => message.type === 'error',
        )[0].text,
      })
    } else {
      form.clearErrors('traits.email')
    }

    const messagesNode = flow.ui.messages?.find(
      (message) => message.type === 'error',
    )
    if (messagesNode) {
      form.setError('root', {
        message: messagesNode.text,
      })
    } else {
      form.clearErrors('root')
    }
  }

  const goto = React.useMemo(() => {
    return `${pathname}?${searchParams.toString()}`
  }, [pathname, searchParams])

  const handleSubmit = form.handleSubmit(async (values) =>
    startTransition(async () => {
      try {
        const res = await ory.updateSettingsFlow({
          flow: flow.id,
          updateSettingsFlowBody: values as UpdateSettingsFlowBody,
        })
        updateFlow(res)
        await ory.toSession().then(updateSession)
      } catch (error) {
        if (error instanceof ResponseError) {
          const res = await error.response.json()

          if (error.response.status === 400) {
            updateErrors(res as unknown as SettingsFlow)
          } else if (error.response.status === 403) {
            if (res.error.id === 'security_csrf_violation') {
              toast({
                title: 'Failed to request email change',
                description: 'CSRF Violation. Please try again.',
                variant: 'destructive',
              })
            } else if (res.error.id === 'session_refresh_required') {
              window.location.href = `${process.env.NEXT_PUBLIC_ORY_SDK_URL}/self-service/login/browser?refresh=true&return_to=${goto}`
            }
          }
        }
      }
    }),
  )

  return (
    <Form {...form}>
      <form className={cn('grid space-y-2', className)} onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="traits.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Email</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  placeholder="email@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <LoadingSpinner /> : <CheckIcon />}
          Request Email Change
        </Button>
        {form.formState.errors.root && <FormRootError />}

        {isSuccess && (
          <p className="text-sm text-green-500">
            Email change request sent. Please check your email for a
            verification code.
          </p>
        )}
      </form>
    </Form>
  )
}
