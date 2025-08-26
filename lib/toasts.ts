import { toast } from 'sonner'

const getDefaultErrorDescription = (error: unknown) => {
  return 'Unknown error'
}

const getErrorDescription = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  } else if (typeof error === 'string') {
    return error
  }
  return getDefaultErrorDescription(error)
}

export const toastError = (message: string, error?: unknown) => {
  const data = error
    ? {
        description: getErrorDescription(error),
      }
    : undefined
  toast.error(message, data)
}
