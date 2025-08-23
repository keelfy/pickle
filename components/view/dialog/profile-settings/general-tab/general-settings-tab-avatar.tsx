import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormMessage } from '@/components/ui/form'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { uploadAvatarForPreview } from '@/hooks/api-endpoints-client'
import { UploadIcon, UserIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import z from 'zod'
import { generalSettingsFormSchema } from './general-settings-form'

type Props = {
  form: UseFormReturn<z.infer<typeof generalSettingsFormSchema>>
}

export default function GeneralSettingsTabAvatar({ form }: Props) {
  const [isAvatarUploading, startAvatarUpload] = React.useTransition()
  const avatarInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0]

      startAvatarUpload(async () => {
        const formData = new FormData()
        formData.append('file', file)

        try {
          const response = await uploadAvatarForPreview(formData)
          if (response.url) {
            form.setValue('avatarUrl', response.url + '?ts=' + Date.now(), {
              shouldDirty: true,
            })
          }
          form.clearErrors('avatarUrl')
        } catch (error) {
          console.error('Error uploading file:', error)
          form.setError('avatarUrl', {
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      })
    }
  }

  return (
    <FormField
      control={form.control}
      name="avatarUrl"
      render={({ field }) => (
        <FormItem className="flex items-center gap-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={field.value} asChild>
              {field.value && (
                <Image
                  src={field.value}
                  alt="Avatar"
                  width={128}
                  height={128}
                  unoptimized
                />
              )}
            </AvatarImage>
            <AvatarFallback>
              <UserIcon className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-2">
            <FormMessage />
            <Button
              type="button"
              variant="secondary"
              disabled={isAvatarUploading}
              className="w-min"
              onClick={() => avatarInputRef.current?.click()}
            >
              {isAvatarUploading ? <LoadingSpinner /> : <UploadIcon />}
              Chose new avatar
            </Button>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              disabled={isAvatarUploading}
              ref={avatarInputRef}
              onChange={(e) => handleFileChange(e.target.files)}
            />
            <div className="text-xs text-muted-foreground">
              Max 5MB • jpg, png, gif, svg, webp or bmp
            </div>
          </div>
        </FormItem>
      )}
    />
  )
}
