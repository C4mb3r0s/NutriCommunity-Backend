import { z } from 'zod'

export const commentParamsSchema = z.object({
  postId: z.uuid()
})

export const commentIdSchema = z.object({
  commentId: z.uuid()
})

export const listCommentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
})

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000)
})
