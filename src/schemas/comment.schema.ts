import { z } from 'zod'

export const commentParamsSchema = z.object({
  postId: z.uuid()
})

export const commentIdSchema = z.object({
  commentId: z.uuid()
})

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000)
})
