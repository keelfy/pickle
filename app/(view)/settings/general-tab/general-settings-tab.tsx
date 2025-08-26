'use client'

import { Button } from '@/components/ui/button'
import { Form, FormRootError } from '@/components/ui/form'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { fetchMyAvatar, updateMe } from '@/hooks/api-endpoints-client'
import { toastError } from '@/lib/toasts'
import { useAuthStore } from '@/providers/auth-store'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, CircleOff } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { generalSettingsFormSchema } from './general-settings-form'
import GeneralSettingsTabAvatar from './general-settings-tab-avatar'
import GeneralSettingsTabDescription from './general-settings-tab-description'
import GeneralSettingsTabDisplayName from './general-settings-tab-display-name'
import GeneralSettingsTabLinks from './general-settings-tab-links'
import GeneralSettingsTabUsername from './general-settings-tab-username'
import { UpdateProfileReq } from '@/utils/api/request'

export default function GeneralSettingsTab() {
  const { user, updateUser } = useAuthStore((state) => state)
  const [isLoading, startTransition] = React.useTransition()

  const [avatarUrl, setAvatarUrl] = React.useState<string>(
    user?.avatarUrl ?? '',
  )

  const form = useForm<z.infer<typeof generalSettingsFormSchema>>({
    resolver: zodResolver(generalSettingsFormSchema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      username: user?.username ?? '',
      description: user?.description ?? '',
      avatarUrl,
      socialLinks: user?.socialLinks ?? [],
    },
  })

  React.useEffect(() => {
    resetForm()
    if (!user?.id) return
    const fetchAvatar = async () => {
      let avatarUrl = user?.avatarUrl ?? ''
      try {
        const res = await fetchMyAvatar('lg')
        avatarUrl = res?.url ?? user?.avatarUrl ?? ''
      } catch (error) {
        console.error('Error fetching avatar:', error)
      }
      setAvatarUrl(avatarUrl)
    }
    fetchAvatar()
  }, [user?.id])

  React.useEffect(() => {
    form.reset({
      ...form.getValues(),
      avatarUrl,
    })
  }, [avatarUrl])

  const onSubmit = form.handleSubmit((data) => {
    if (!user) return
    startTransition(async () => {
      try {
        const req: UpdateProfileReq = {
          suggestionPreferences: user.suggestionPreferences,
          ...data,
        }
        await updateMe(req)
        updateUser({
          ...user,
          ...data,
        })
        form.reset({
          ...data,
        })
      } catch (error) {
        toastError('Failed to update settings', error)
      }
    })
  })

  const resetForm = () => {
    form.reset({
      ...user,
      description: user?.description ?? '',
      socialLinks: user?.socialLinks ?? [],
      avatarUrl,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="flex h-full w-full flex-col justify-between space-y-6"
      >
        <div className="flex flex-col space-y-6">
          <GeneralSettingsTabAvatar form={form} />
          <GeneralSettingsTabDisplayName form={form} />
          <GeneralSettingsTabUsername form={form} />
          <GeneralSettingsTabDescription form={form} />
          <GeneralSettingsTabLinks form={form} />
        </div>
        <FormRootError />
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <LoadingSpinner /> : <Check />}
            Confirm
          </Button>
        </div>
      </form>
    </Form>
  )
}
