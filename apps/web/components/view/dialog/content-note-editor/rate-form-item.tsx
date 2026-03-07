import RatingRowInput from '@/app/(view)/[username]/components/rating-row-input'
import { Button } from '@/components/ui/button'
import { FormControl, FormItem, FormLabel } from '@/components/ui/form'
import { HeartIcon, XIcon } from 'lucide-react'
import { ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form'

type Props<V extends FieldValues, N extends FieldPath<V>> = {
  field: ControllerRenderProps<V, N>
}

export default function RateFormItem<
  V extends FieldValues,
  N extends FieldPath<V>,
>({ field }: Props<V, N>) {
  return (
    <FormItem>
      <div className="flex items-center justify-between gap-2">
        <FormLabel className="text-md flex items-center gap-2 font-semibold">
          <HeartIcon className="size-4" />
          Rate
        </FormLabel>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => field.onChange(undefined)}
        >
          <XIcon className="size-4" />
          Clear
        </Button>
      </div>
      <FormControl className="flex justify-center lg:justify-start">
        <RatingRowInput value={field.value ?? 0} onChange={field.onChange} />
      </FormControl>
    </FormItem>
  )
}
