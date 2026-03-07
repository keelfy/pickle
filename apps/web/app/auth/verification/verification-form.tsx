'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/ui/loading-spinner'
import ory from '@/lib/ory'
import { toastError } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/providers/auth-store'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ErrorBrowserLocationChangeRequired,
  ErrorGeneric,
  isResponseError,
  LoginFlow,
  UiNode,
  UiNodeAnchorAttributes,
  UiNodeInputAttributes,
  VerificationFlow,
} from '@ory/client-fetch'
import { CheckIcon, MailIcon } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useTranslations } from 'next-intl'
import React from 'react'
import { FieldErrors, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Props = {
  className?: string
  flow: VerificationFlow | undefined
  updateFlow: (flow: VerificationFlow) => void
  isFlowLoading?: boolean
}

const formSchema = z.object({
  flowState: z.string(),
  csrfToken: z.string(),
  email: z.string(),
  code: z.string(),
})

const getOryUiNodeByGroupAndName = (
  nodes: UiNode[],
  group: string,
  name: string,
) => {
  return nodes.find(
    (node) =>
      node.group === group &&
      (node.attributes as UiNodeInputAttributes).name === name,
  )
}

const VerificationForm = ({
  className,
  flow,
  updateFlow,
  isFlowLoading = false,
}: Props) => {
  const t = useTranslations('auth.verification')
  const tAuth = useTranslations('auth')
  const [goto] = useQueryState('goto', parseAsString.withDefault(''))
  const [codeParam, setCodeParam] = useQueryState(
    'code',
    parseAsString.withDefault(''),
  )
  const [emailParam, setEmailParam] = useQueryState(
    'email',
    parseAsString.withDefault(''),
  )
  const session = useAuthStore((store) => store.session)

  const [email, setEmail] = React.useState<string>(emailParam)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flowState: flow?.state ?? 'choose_method',
      csrfToken: '',
      email: emailParam,
      code: codeParam,
    },
  })

  const [isLoading, startTransition] = React.useTransition()

  const [isCodeResending, startCodeResendTransition] = React.useTransition()

  React.useEffect(() => {
    if (!flow) return

    const csrfToken =
      (
        getOryUiNodeByGroupAndName(flow.ui.nodes, 'default', 'csrf_token')
          ?.attributes as UiNodeInputAttributes
      )?.value ?? ''
    const email =
      (
        getOryUiNodeByGroupAndName(flow.ui.nodes, 'code', 'email')
          ?.attributes as UiNodeInputAttributes
      )?.value ??
      emailParam ??
      (session?.identity?.verifiable_addresses &&
        session.identity.verifiable_addresses.length > 0 &&
        session.identity.verifiable_addresses.find(
          (address) => !address.verified,
        )?.value) ??
      ''

    form.reset({
      flowState: flow?.state ?? 'choose_method',
      csrfToken,
      email,
      code: codeParam,
    })

    setEmail(email)

    if (csrfToken.length > 0 && email.length > 0 && codeParam.length > 0) {
      onFlowSubmit(form.getValues())
    }
  }, [flow?.id])

  const onFlowSubmit = (data: z.infer<typeof formSchema>) =>
    startTransition(async () => {
      if (!flow) return
      try {
        const res = await ory.updateVerificationFlow({
          flow: flow.id,
          updateVerificationFlowBody: {
            method: 'code',
            csrf_token: data.csrfToken,
            code: data.code,
            email: data.email,
          },
        })
        updateFlow(res)
        // if (res.state === 'passed_challenge') {
        //     window.location.href = process.env.NEXT_PUBLIC_DOMAIN + decodeURIComponent(goto);
        // }
      } catch (error) {
        if (isResponseError(error)) {
          if (error.response.status === 400) {
            const res = (await error.response.json()) as LoginFlow
            updateFlow(res)
          } else if (error.response.status === 422) {
            const res =
              (await error.response.json()) as ErrorBrowserLocationChangeRequired
            if (res.redirect_browser_to) {
              window.location.href = res.redirect_browser_to
            }
          } else {
            const res = (await error.response.json()) as ErrorGeneric
            toastError(t('failedRegister'), res.error)
          }
        } else {
          toastError(t('failedRegister'), error)
        }
      }
    })

  const onCodeResend = () =>
    startCodeResendTransition(async () => {
      if (!flow) return
      try {
        const res = await ory.updateVerificationFlow({
          flow: flow.id,
          updateVerificationFlowBody: {
            method: 'code',
            csrf_token: form.watch('csrfToken'),
            email: form.watch('email'),
          },
        })
        updateFlow(res)
        if (res.state === 'sent_email') {
          toast.success(t('codeSentTitle'), {
            description: t('codeSentDescription'),
          })
        }
      } catch (error) {
        if (isResponseError(error)) {
          if (error.response.status === 400) {
            const res = (await error.response.json()) as LoginFlow
            updateFlow(res)
          } else if (error.response.status === 422) {
            const res =
              (await error.response.json()) as ErrorBrowserLocationChangeRequired
            if (res.redirect_browser_to) {
              window.location.href = res.redirect_browser_to
            }
          } else {
            const res = (await error.response.json()) as ErrorGeneric
            toastError(t('failedRegister'), res.error)
          }
        } else {
          toastError(t('failedRegister'), error)
        }
      }
    })

  const onSubmitError = (errors: FieldErrors<z.infer<typeof formSchema>>) => {
    toastError(t('failedSubmit'), errors)
  }

  React.useEffect(() => {
    const msg = flow?.ui?.messages?.find(
      (message) => message.type === 'error',
    )?.text
    if (msg) {
      form.setError('root', {
        message: msg,
      })
    } else {
      form.clearErrors('root')
    }
  }, [flow?.ui?.messages])

  const getFlowStateForm = () => {
    if (
      (flow?.state === 'sent_email' || form.watch('email').length > 0) &&
      flow?.state !== 'passed_challenge'
    ) {
      return (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFlowSubmit, onSubmitError)}
            className="grid gap-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="code">{t('codeLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      required
                      placeholder={t('codePlaceholder')}
                      type="text"
                      autoComplete="one-time-code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-2">
              {flow?.state === 'sent_email' && (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isFlowLoading}
                >
                  {isLoading || isFlowLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <CheckIcon
                      className={`h-4 w-4 ${flow?.state === 'passed_challenge' ? 'text-green-500' : ''}`}
                    />
                  )}
                  {flow?.state === 'passed_challenge'
                    ? t('verified')
                    : t('verify')}
                </Button>
              )}
              <Button
                type="button"
                variant={flow?.state === 'sent_email' ? 'secondary' : 'default'}
                className="w-full"
                disabled={isCodeResending || isFlowLoading}
                onClick={onCodeResend}
              >
                {isCodeResending || isFlowLoading ? (
                  <LoadingSpinner />
                ) : (
                  <MailIcon className="h-4 w-4" />
                )}
                {flow?.state === 'sent_email' ? t('resendCode') : t('sendCode')}
              </Button>
              {form.formState.errors.root && <FormRootError />}
            </div>
          </form>
        </Form>
      )
    } else if (flow?.state === 'choose_method') {
      return (
        <form
          onSubmit={() => {
            form.setValue('email', email)
            setEmailParam(email)
          }}
          className="grid gap-4"
        >
          <div className="grid gap-3">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              required
              placeholder={t('emailPlaceholder')}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isFlowLoading}
          >
            {isLoading || (isFlowLoading && <LoadingSpinner />)}
            {t('continue')}
          </Button>
        </form>
      )
    } else if (flow?.state === 'passed_challenge') {
      const href = (
        flow?.ui?.nodes.find(
          (node) =>
            node.group === 'code' &&
            node.type === 'a' &&
            (node.attributes as UiNodeAnchorAttributes).id === 'continue',
        )?.attributes as UiNodeAnchorAttributes
      )?.href
      return (
        <Button
          type="button"
          className="w-full"
          onClick={() =>
            (window.location.href =
              href ??
              process.env.NEXT_PUBLIC_DOMAIN +
                decodeURIComponent(flow?.return_to ?? ''))
          }
        >
          Continue
        </Button>
      )
    }
  }

  return (
    <Card className={cn(className, 'max-w-sm')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <CheckIcon className="h-6 w-6 text-green-500" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {getFlowStateForm()}
        <div className="text-center text-sm">
          {tAuth('dontHaveAccount')}&nbsp;
          <Link
            href={{
              pathname: '/auth/login',
              query: { goto },
            }}
            className="underline"
          >
            {tAuth('signUp')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default VerificationForm
