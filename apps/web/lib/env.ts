import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_BACKEND_URL: z.string().url(),
  NEXT_PUBLIC_BACKEND_WS: z.string().min(1),
  NEXT_PUBLIC_ORY_SDK_URL: z.string().url(),
})

export const env = envSchema.parse({
  NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_BACKEND_WS: process.env.NEXT_PUBLIC_BACKEND_WS,
  NEXT_PUBLIC_ORY_SDK_URL: process.env.NEXT_PUBLIC_ORY_SDK_URL,
})
