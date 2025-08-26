import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ProfileLink } from '@/lib/model/user'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripHorizontalIcon, TrashIcon } from 'lucide-react'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import z from 'zod'
import { generalSettingsFormSchema } from './general-settings-form'

type SortableProfileLinkProps = {
  form: UseFormReturn<z.infer<typeof generalSettingsFormSchema>>
  item: ProfileLink
  index: number
}

export default function SortableProfileLink({
  item,
  index,
  form,
}: SortableProfileLinkProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleEditLink({ ...item, url: e.target.value })
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleEditLink({ ...item, name: e.target.value })
  }

  const handleRemoveLink = (link: ProfileLink) => {
    const oldValue = form.getValues('socialLinks') ?? []
    const newLinks = oldValue.filter((l) => l.id !== link.id)
    form.setValue('socialLinks', newLinks)
    form.clearErrors('socialLinks')
    form.setFocus('socialLinks')
  }

  const handleEditLink = (editedLink: ProfileLink) => {
    const links = form.getValues('socialLinks') ?? []
    const newLinks = links.map((current) => {
      if (current.id === editedLink.id) {
        return editedLink
      }
      return current
    })
    form.setValue('socialLinks', newLinks)
    form.clearErrors('socialLinks')
    form.setFocus('socialLinks')
  }

  return (
    <div style={style} className="flex items-end gap-2">
      <div
        ref={setNodeRef}
        className="flex h-9 items-center justify-center"
        {...attributes}
        {...listeners}
      >
        <GripHorizontalIcon className="size-5" />
      </div>
      <div className="flex flex-1 items-end gap-1">
        <div className="flex flex-1 items-end gap-1">
          <FormField
            control={form.control}
            name={`socialLinks.${index}.name`}
            render={({ field }) => (
              <FormItem className="basis-1/3 space-y-0.5">
                <FormLabel className="text-xs text-muted-foreground">
                  Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormMessage className="text-xs" />
                <FormControl>
                  <Input
                    className="h-9"
                    placeholder="Specify a name"
                    value={field.value}
                    onBlur={handleNameChange}
                    onChange={handleNameChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`socialLinks.${index}.url`}
            render={({ field }) => (
              <FormItem className="basis-2/3 space-y-0.5">
                <FormLabel className="text-xs text-muted-foreground">
                  URL <span className="text-red-500">*</span>
                </FormLabel>
                <FormMessage className="text-xs" />
                <FormControl>
                  <Input
                    className="h-9"
                    placeholder="Specify a URL"
                    value={field.value}
                    onBlur={handleUrlChange}
                    onChange={handleUrlChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveLink(item)}
        >
          <TrashIcon className="size-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  )
}
