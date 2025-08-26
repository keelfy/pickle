import { Button } from '@/components/ui/button'
import { FormDescription, FormLabel } from '@/components/ui/form'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { PlusIcon } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import z from 'zod'
import {
  generalSettingsFormSchema,
  maxProfileLinks,
} from './general-settings-form'
import SortableProfileLink from './sortable-profile-link'
import { ProfileLink } from '@/lib/model/user'
import { cn } from '@/lib/utils'

type Props = {
  form: UseFormReturn<z.infer<typeof generalSettingsFormSchema>>
  className?: string
}

export default function GeneralSettingsTabLinks({ form, className }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const field = form.getValues('socialLinks')
    if (over && active.id !== over.id && field) {
      const activeLink = field?.find((link) => link.id === active.id)
      const overLink = field?.find((link) => link.id === over.id)
      if (activeLink && overLink) {
        const newLinks = field?.map((link) => {
          if (link.id === active.id) {
            return { ...link, position: overLink.position }
          }
          if (link.id === over.id) {
            return { ...link, position: activeLink.position }
          }
          return link
        })
        form.setValue('socialLinks', newLinks)
        form.clearErrors('socialLinks')
        form.setFocus('socialLinks')
      }
    }
  }

  const handleAddLink = () => {
    const oldValue = form.getValues('socialLinks') ?? []
    const profileLink: ProfileLink = {
      id: crypto.randomUUID(),
      name: '',
      url: '',
      position: oldValue.length,
    }
    form.setValue('socialLinks', [...oldValue, profileLink])
    form.clearErrors('socialLinks')
    form.setFocus('socialLinks')
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <FormLabel htmlFor="socialLinks">Links</FormLabel>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={
            form
              .getValues('socialLinks')
              ?.sort((a, b) => a.position - b.position)
              .map((link) => link.id) ?? []
          }
          strategy={verticalListSortingStrategy}
        >
          {form
            .getValues('socialLinks')
            ?.sort((a, b) => a.position - b.position)
            .map((item, index) => (
              <SortableProfileLink
                key={item.id}
                form={form}
                item={item}
                index={index}
              />
            ))}
        </SortableContext>
      </DndContext>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleAddLink}
      >
        <PlusIcon />
        Add link
      </Button>
      <FormDescription>
        Share your social media profiles with others. Links will be displayed on
        your profile. You can add up to {maxProfileLinks}
        &nbsp;links.
      </FormDescription>
    </div>
  )
}
