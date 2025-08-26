import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import { CheckIcon, XIcon } from 'lucide-react'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import z from 'zod'
import { generalSettingsFormSchema } from './general-settings-form'
import { useAuthStore } from '@/providers/auth-store'
import { validateUsername } from '@/hooks/api-endpoints-client'

type Props = {
  form: UseFormReturn<z.infer<typeof generalSettingsFormSchema>>
}

export default function GeneralSettingsTabUsername({ form }: Props) {
  const profile = useAuthStore((state) => state.user)
  const [isLinkValidating, setLinkValidating] = React.useState(false)

  const LinkValidationStatusIcon = ({ className }: { className?: string }) => {
    if (isLinkValidating) {
      return <LoadingSpinner className={cn('h-4 w-4', className)} />
    }

    return !form.getFieldState('username').invalid ? (
      <CheckIcon className={cn('size-4 text-green-500', className)} />
    ) : (
      <XIcon className={cn('size-4 text-red-500', className)} />
    )
  }

  React.useEffect(() => {
    const username = form.watch('username')
    if (username === profile?.username) {
      form.clearErrors('username')
      return
    }

    const getData = setTimeout(async () => {
      try {
        setLinkValidating(true)
        const res = await validateUsername(username)
        if (res.valid) {
          form.clearErrors('username')
        } else {
          form.setError('username', {
            message: res.message,
          })
        }
      } catch (error) {
        form.setError('username', {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
      setLinkValidating(false)
    }, 300)
    return () => clearTimeout(getData)
  }, [form, form.watch('username'), profile?.username])

  return (
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="username">Link to your page</FormLabel>
          <div className="flex">
            <div className="flex items-center justify-center rounded-l-md border border-r-0 bg-primary-foreground px-2 text-sm">
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
  )
}
