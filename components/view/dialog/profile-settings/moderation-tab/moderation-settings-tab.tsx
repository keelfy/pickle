import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  fetchAddModerator,
  fetchModeratorProfiles,
} from '@/hooks/api-endpoints-client'
import { toast } from '@/hooks/use-toast'
import { useAuthStore } from '@/providers/auth-store'
import { Moderator } from '@/lib/model/moderator'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Loader2,
  PlusIcon,
  ShieldAlertIcon,
  UserCog,
  UserPlusIcon,
} from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import ModeratorElement from './moderator-element'

const formSchema = z.object({
  link: z.string().min(3, {
    message: 'Link is required',
  }),
})

type ModeratorEntry = Moderator & {
  isLoading?: boolean
  link?: string
}

export default function ModerationSettingsTab() {
  const user = useAuthStore((state) => state.user)
  const [moderatorProfiles, setModeratorProfiles] = React.useState<
    ModeratorEntry[]
  >([])
  const [isFetchingModerators, startFetchingModerators] = React.useTransition()
  const [isAddingModerator, startAddingModerator] = React.useTransition()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      link: '',
    },
  })

  React.useEffect(() => {
    if (!user) return
    startFetchingModerators(() =>
      fetchModeratorProfiles(user)
        .then(setModeratorProfiles)
        .catch((error) => {
          toast({
            title: 'Error fetching moderators',
            description:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred',
            variant: 'destructive',
          })
        }),
    )
  }, [user?.id])

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (!user) return
    startAddingModerator(async () => {
      const prevModeratorProfiles = [...moderatorProfiles]
      const optimisticModerator: ModeratorEntry = {
        id: crypto.randomUUID(),
        displayName: 'Loading...',
        username: 'Loading...',
        link: data.link,
        avatarUrl: '',
        addedAt: new Date(),
        isLoading: true,
        userId: user.id,
        moderatorUserId: user.id,
      }
      setModeratorProfiles([...prevModeratorProfiles, optimisticModerator])
      try {
        const addedModerator = await fetchAddModerator(user, data.link)
        setModeratorProfiles([
          ...prevModeratorProfiles,
          {
            ...addedModerator,
            link: data.link,
            isLoading: false,
          },
        ])
        form.reset()
      } catch (error) {
        setModeratorProfiles(prevModeratorProfiles)
        toast({
          title: 'Error adding moderator',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          variant: 'destructive',
        })
      }
    })
  }

  const afterModeratorDelete = (moderatorId: string) => {
    setModeratorProfiles(moderatorProfiles.filter((m) => m.id !== moderatorId))
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <ShieldAlertIcon className="h-5 w-5" />
          What can moderators do?
        </h2>
        <ul className="list-inside list-disc text-sm">
          <li>Manage content (add, edit, delete)</li>
          <li>Approve or reject suggestions</li>
          <li>Manage collections (add, edit, delete)</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <UserCog className="h-5 w-5" />
          Moderators
        </h2>
        {moderatorProfiles.length === 0 ? (
          isFetchingModerators ? (
            <div className="flex w-full items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No moderators added yet.
            </p>
          )
        ) : (
          moderatorProfiles.map((moderator) => (
            <ModeratorElement
              key={moderator.id}
              moderator={moderator}
              isLoading={moderator.isLoading}
              afterDelete={() => afterModeratorDelete(moderator.id)}
            />
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <UserPlusIcon className="h-5 w-5" />
          Add moderator
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormDescription>
                    You can add a new moderator by{' '}
                    <span className="font-bold">link to their profile</span>.
                  </FormDescription>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        placeholder="pickle.pw/unique-link"
                        {...field}
                        className="flex-1"
                      />
                    </FormControl>
                    <Button type="submit" disabled={isAddingModerator}>
                      {isAddingModerator ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <PlusIcon />
                      )}
                      Add
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </div>
  )
}
