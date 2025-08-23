import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { UseFormReturn } from 'react-hook-form'
import z from 'zod'
import {
  generalSettingsFormSchema,
  maxProfileDescriptionLength,
} from './general-settings-form'

type Props = {
  form: UseFormReturn<z.infer<typeof generalSettingsFormSchema>>
}

export default function GeneralSettingsTabDescription({ form }: Props) {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor="description">Description</FormLabel>
          <FormControl>
            <Textarea placeholder="I'm a cool person." {...field} />
          </FormControl>
          <FormDescription>
            A short description about yourself that will be displayed on your
            profile. {maxProfileDescriptionLength} characters max.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
