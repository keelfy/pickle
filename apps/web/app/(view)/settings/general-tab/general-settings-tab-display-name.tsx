import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UseFormReturn } from 'react-hook-form'
import z from 'zod'
import { generalSettingsFormSchema } from './general-settings-form'

type Props = {
  form: UseFormReturn<z.infer<typeof generalSettingsFormSchema>>
}

export default function GeneralSettingsTabDisplayName({ form }: Props) {
  return (
    <FormField
      control={form.control}
      name="displayName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Display name</FormLabel>
          <FormControl>
            <Input placeholder="Jane Doe" {...field} />
          </FormControl>
          <FormDescription>
            This is how your name will be displayed on your profile.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
