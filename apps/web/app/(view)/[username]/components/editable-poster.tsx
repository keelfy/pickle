'use client'

import {
  useDeletePosterPreviewMutation,
  useUploadPosterPreviewMutation,
} from '@/hooks/mutations/use-profile-mutations'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/providers/profile-store'
import { Upload } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import FileSelectPopover from '../file-select-popover'
import { CoverPreview } from '@/lib/model/cover'

type Props = {
  value?: string
  defaultImageUrl?: string
  onChange: (value: string | undefined) => void
}

const EditablePoster = ({ value, defaultImageUrl, onChange }: Props) => {
  const profile = useProfileStore((state) => state.profile)
  const uploadPosterPreviewMutation = useUploadPosterPreviewMutation()
  const deletePosterPreviewMutation = useDeletePosterPreviewMutation()
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(
    defaultImageUrl,
  )

  async function uploadImage(file: File) {
    if (!profile) return
    const formData = new FormData()
    formData.append('file', file)
    return uploadPosterPreviewMutation.mutateAsync({
      user: profile,
      formData,
      size: 'md',
    })
  }

  async function deleteImage(id: string) {
    if (!profile) return
    deletePosterPreviewMutation.mutateAsync({ user: profile, id })
  }

  async function embedImage(url: string) {
    if (!profile) return
    const formData = new FormData()
    formData.append('url', url)
    return uploadPosterPreviewMutation.mutateAsync({
      user: profile,
      formData,
      size: 'md',
    })
  }

  function onImagePreviewChanged(preview: CoverPreview | undefined) {
    setPreviewUrl(preview?.url ?? defaultImageUrl)
    onChange(preview?.previewId)
  }

  React.useEffect(() => {
    setPreviewUrl(defaultImageUrl)
  }, [defaultImageUrl])

  return (
    <div className="relative flex max-h-[225px] min-h-max min-w-max max-w-[150px] flex-col">
      {previewUrl ? (
        <Image
          src={previewUrl ?? ''}
          alt="Poster preview"
          width={150}
          height={225}
          className="rounded-lg"
          unoptimized
        />
      ) : (
        <div className="h-[225px] w-[150px] rounded-lg" />
      )}
      <FileSelectPopover
        selectedPreviewId={value}
        onImagePreviewChanged={onImagePreviewChanged}
        uploadImage={uploadImage}
        deleteImage={deleteImage}
        embedImage={embedImage}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 flex h-full w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-primary-foreground/70 transition-opacity duration-500 hover:opacity-100',
            previewUrl ? 'opacity-0' : 'opacity-100',
          )}
        >
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg px-2 py-4">
            <Upload className="h-8 w-8" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Click to upload
            </p>
          </div>
        </button>
      </FileSelectPopover>
    </div>
  )
}

export default EditablePoster
