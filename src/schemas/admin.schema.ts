import { z } from 'zod'

export const adminuserParamsSchema = z.object({
  userId: z.uuid()
})

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'deleted'])
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
})
