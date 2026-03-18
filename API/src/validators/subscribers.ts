import { z } from 'zod'

export const subscriberCreateSchema = z.object({
    targetUrl: z.url().min(1)
})

export const subscriberUpdateSchema = z.object({
    targetUrl: z.url().min(1)
})