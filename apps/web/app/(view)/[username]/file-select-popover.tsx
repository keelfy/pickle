'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/ui/loading-spinner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { CoverPreview } from '@/lib/model/cover'
import { PopoverClose } from '@radix-ui/react-popover'
import { cva, VariantProps } from 'class-variance-authority'
import { ImageIcon, TrashIcon, X } from 'lucide-react'
import React from 'react'

const fileElementVariants = cva('h-12', {
  variants: {
    variant: {
      invalid: 'border-destructive/50',
      default: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const DeletableFileElement = ({
  className,
  variant = 'default',
  fileName,
  fileSize,
  onDelete,
  onSelect,
  loading = false,
  error,
  selected = false,
}: {
  className?: string
  fileName: string
  fileSize: string
  onDelete: () => void
  onSelect?: () => void
  loading?: boolean
  error?: string
  selected?: boolean
} & VariantProps<typeof fileElementVariants>) => {
  return (
    <div className={cn('flex w-full', className)}>
      <Button
        variant={selected ? 'secondary' : 'outline'}
        className={cn(
          fileElementVariants({ variant }),
          'flex-1 rounded-r-none text-start',
        )}
        onClick={onSelect}
      >
        <div className="flex h-full w-full items-center gap-2">
          <ImageIcon size={32} className="min-h-8 min-w-8" />
          <div className="flex flex-col gap-0">
            <p className="max-w-60 truncate font-semibold">{fileName}</p>
            <p className="text-xs text-muted-foreground">{error ?? fileSize}</p>
          </div>
        </div>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onDelete}
        disabled={loading}
        className={cn(
          fileElementVariants({ variant }),
          'w-12 rounded-l-none border-l-0',
        )}
      >
        {loading ? <LoadingSpinner /> : <TrashIcon />}
      </Button>
    </div>
  )
}

const TabButton = ({
  selected,
  children,
  ...props
}: React.PropsWithChildren<
  React.ComponentProps<'button'> & {
    selected: boolean
  }
>) => {
  return (
    <div
      className={cn(
        'relative before:absolute before:bottom-1 before:left-[50%] before:h-[2px] before:w-[0%] before:origin-center before:bg-muted-foreground/100 before:opacity-0 before:transition-all after:absolute after:bottom-1 after:right-[50%] after:h-[2px] after:w-[0%] after:origin-center after:bg-muted-foreground/100 after:opacity-0 after:transition-all',
        selected &&
          'before:w-[40%] before:opacity-100 after:w-[40%] after:opacity-100',
      )}
    >
      <Button
        variant="ghost"
        className={cn('px-2', !selected && 'text-muted-foreground')}
        {...props}
      >
        {children}
      </Button>
    </div>
  )
}

function calculateFileSize(file: File): string {
  const size = file.size / 1024
  if (size < 1024) {
    return `${size.toFixed(2)} KB`
  }
  return `${(size / 1024).toFixed(2)} MB`
}

export type ImageFile = {
  uploadId: string
  file?: File
  isLoading: boolean
  preview?: CoverPreview
  error?: string
}

type Props = {
  className?: string
  selectedPreviewId?: string
  onImagePreviewChanged: (preview: CoverPreview | undefined) => void
  uploadImage: (file: File) => Promise<CoverPreview | undefined>
  embedImage: (url: string) => Promise<CoverPreview | undefined>
  deleteImage: (id: string) => Promise<void>
}

type Tab = 'upload' | 'embed' | 'search'

const maxFiles = 5

export default function FileSelectPopover({
  children,
  selectedPreviewId,
  onImagePreviewChanged,
  uploadImage,
  embedImage,
  deleteImage,
}: React.PropsWithChildren<Props>) {
  const [tab, setTab] = React.useState<Tab>('upload')
  const [imageFiles, setImageFiles] = React.useState<ImageFile[]>([])
  const [embedUrl, setEmbedUrl] = React.useState('')
  const [prevEmbedUrl, setPrevEmbedUrl] = React.useState('')
  const [isEmbedLoading, setIsEmbedLoading] = React.useState(false)

  const debouncedEmbedUrl = useDebounce(embedUrl, 300)

  React.useEffect(() => {
    if (!debouncedEmbedUrl) return
    try {
      new URL(debouncedEmbedUrl)
    } catch {
      return
    }

    if (debouncedEmbedUrl === prevEmbedUrl) return
    setPrevEmbedUrl(debouncedEmbedUrl)

    const imageFile: ImageFile = {
      uploadId: crypto.randomUUID(),
      isLoading: false,
    }

    ;(async () => {
      setIsEmbedLoading(true)
      await handleImageAdd(imageFile, () => embedImage(debouncedEmbedUrl))
      setIsEmbedLoading(false)
    })()
  }, [debouncedEmbedUrl, onImagePreviewChanged])

  function updateImageFileById(id: string, update: Partial<ImageFile>) {
    setImageFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.uploadId === id ? { ...file, ...update } : file,
      ),
    )
  }

  function handleFileChange(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return
    }

    const imageFile: ImageFile = {
      uploadId: crypto.randomUUID(),
      file: fileList[0],
      isLoading: false,
    }

    ;(async () =>
      handleImageAdd(imageFile, (imageFile) => uploadImage(imageFile.file!)))()
  }

  async function handleImageAdd(
    imageFile: ImageFile,
    uploadFunc: (imageFile: ImageFile) => Promise<CoverPreview | undefined>,
  ) {
    let clearPreview = false

    setImageFiles((prevFiles) => {
      if (
        prevFiles.length >= maxFiles &&
        selectedPreviewId === prevFiles[prevFiles.length - 1].preview?.previewId
      ) {
        clearPreview = true
      }

      const newFiles = [imageFile, ...prevFiles]
      return newFiles.slice(0, maxFiles)
    })

    updateImageFileById(imageFile.uploadId, {
      isLoading: true,
    })

    try {
      const res = await uploadFunc(imageFile)
      updateImageFileById(imageFile.uploadId, {
        preview: res ? { ...res } : undefined,
      })
      onImagePreviewChanged(res)
    } catch (error) {
      updateImageFileById(imageFile.uploadId, {
        error: error instanceof Error ? error.message : 'An error occurred',
      })

      if (clearPreview) {
        onImagePreviewChanged(undefined)
      }
    }

    updateImageFileById(imageFile.uploadId, {
      isLoading: false,
    })
  }

  function onImageFileDeleted(imageFile: ImageFile) {
    setImageFiles((prevFiles) =>
      prevFiles.filter((file) => file.uploadId !== imageFile.uploadId),
    )
    onImagePreviewChanged(undefined)

    if (imageFile.error) {
      return
    }

    ;(async () => {
      try {
        if (imageFile.preview?.previewId) {
          await deleteImage(imageFile.preview!.previewId)
        }
      } catch (error) {
        console.error(error)
      }
    })()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="grid min-w-96 gap-2 p-2" align="start">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TabButton
              selected={tab === 'upload'}
              onClick={() => setTab('upload')}
            >
              Upload
            </TabButton>
            <TabButton
              selected={tab === 'embed'}
              onClick={() => setTab('embed')}
            >
              Embed link
            </TabButton>
            <TabButton
              selected={tab === 'search'}
              onClick={() => setTab('search')}
              disabled
            >
              Search
            </TabButton>
          </div>
          <PopoverClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </PopoverClose>
        </div>
        <div className="inline-flex flex-col gap-3">
          {tab === 'upload' && (
            // eslint-disable-next-line jsx-a11y/label-has-associated-control
            <label
              htmlFor="dropzone-file"
              className="m-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-500 transition-colors hover:dark:border-gray-400"
            >
              <div className="flex flex-col items-center justify-center gap-1 px-4 pb-6 pt-5">
                <p className="text-nowrap text-sm">
                  Drag & drop your file here or&nbsp;
                  <span className="underline">click to select</span>
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  JPEG, PNG or WEBP
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  2/3 ratio recommended
                </p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </label>
          )}
          {tab === 'embed' && (
            <div id="embed-link-container" className="flex flex-col gap-2">
              <Input
                type="url"
                placeholder="Paste image URL here..."
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                className="w-full"
              />
              {isEmbedLoading && (
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          )}
          <Label className="text-xs text-muted-foreground">
            The maximum file size is 5 MB
          </Label>
          <div className="grid gap-2">
            {imageFiles.map(
              ({ file, uploadId, isLoading, preview, error }, index) => (
                <DeletableFileElement
                  key={index}
                  fileName={file?.name ?? preview?.previewId ?? uploadId ?? ''}
                  fileSize={file ? calculateFileSize(file) : ''}
                  loading={isLoading}
                  selected={selectedPreviewId === preview?.previewId && !error}
                  variant={error ? 'invalid' : 'default'}
                  error={error}
                  onDelete={() =>
                    onImageFileDeleted({
                      file,
                      uploadId,
                      isLoading,
                      preview,
                      error,
                    })
                  }
                  onSelect={() =>
                    error !== undefined || isLoading
                      ? undefined
                      : onImagePreviewChanged(preview)
                  }
                />
              ),
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
