import { toast } from './use-toast'

export const errorToast = (title: string, error: unknown) =>
  toast({
    title,
    description: error instanceof Error ? error.message : 'An error occurred',
    variant: 'destructive',
  })
