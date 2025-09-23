import { Textarea } from '@/components/ui/textarea'
import { FormControl } from '@/components/ui/form'
import { MessageCircleIcon } from 'lucide-react'
import { FormLabel } from '@/components/ui/form'
import { FormItem } from '@/components/ui/form'
import { ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '@/lib/utils'

type Props<V extends FieldValues, N extends FieldPath<V>> = {
  field: ControllerRenderProps<V, N>
}

export default function CommentFormItem<
  V extends FieldValues,
  N extends FieldPath<V>,
>({ field }: Props<V, N>) {
  return (
    <FormItem className="space-y-2">
      <FormLabel className="text-md flex items-center gap-2 font-semibold">
        <MessageCircleIcon className="size-4" />
        Comment
        <span className="text-sm text-muted-foreground">
          &nbsp;(
          <span
            className={cn(
              (field.value?.length ?? 0) > 10000 && 'text-orange-500',
            )}
          >
            {field.value?.length ?? 0}
          </span>
          /10000)
        </span>
      </FormLabel>
      <FormControl>
        <Textarea {...field} placeholder="Type your comment here." />
      </FormControl>
    </FormItem>
  )
}
