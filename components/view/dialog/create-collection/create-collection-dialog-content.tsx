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
import { fetchCreateCollection } from '@/hooks/api-endpoints-client'
import { toast } from '@/hooks/use-toast'
import { useModalStore } from '@/providers/modal'
import { useProfileStore } from '@/providers/profile-store'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X } from 'lucide-react'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCollectionContext } from '../../../ui/content-collections/collections-context'

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(50, { message: 'Name must be less than 50 characters' }),
})

export default function CreateCollectionDialogContent() {
  const { closeModal } = useModalStore((state) => state)
  const profile = useProfileStore((state) => state.profile)
  const [isLoading, startTransition] = useTransition()
  const { addCollection, updateCollection, deleteCollection } =
    useCollectionContext()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: 'Untitled collection' },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      if (!profile) return
      const optimisticCollection = {
        id: crypto.randomUUID(),
        name: data.name,
        itemCount: 0,
        createdAt: new Date(),
      }
      addCollection(optimisticCollection)
      try {
        const newCollection = await fetchCreateCollection(profile, data)
        updateCollection(optimisticCollection.id, newCollection)
        closeModal()
        toast({
          title: data.name,
          description: 'Collection created successfully',
        })
      } catch (error) {
        deleteCollection(optimisticCollection.id)
        toast({
          title: 'Error while creating collection',
          description:
            error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create collection</DialogTitle>
        <DialogDescription>
          You can combine anything (e.g. games, movies, series, etc.) into a
          collection visible to everyone.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. My favorite games" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="mt-4">
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
